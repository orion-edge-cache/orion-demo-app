import base64
import json
import urllib.request

from disallowed_headers import is_blacklisted_or_readonly_header

# Max cacheable size on each header.
CACHE_PAYLOAD_SIZE_LIMIT = 1783
# Max splitted number for request payload.
NUM_SPLIT_MAX = 5

# GraphQL endpoint and domains
GRAPHQL_ENDPOINT = "/graphql"
SITE_DOMAIN = "vfa102.xyz"
ORIGIN_DOMAIN = "ec2-54-165-253-142.compute-1.amazonaws.com"


def http_request(endpoint, method='GET', headers=None, data=None):
    if headers is None:
        headers = {}

    req = urllib.request.Request(
        endpoint, method=method, headers=headers, data=data)
    res = urllib.request.urlopen(req)
    res_code = res.status
    res_body = res.read().decode('utf-8')
    res_headers = response_headers(res)

    return {
        'status': res_code,
        'headers': remove_disallowed_headers(res_headers),
        'body': res_body,
    }


def response_headers(res):
    return {
        key.lower(): [{'key': key, 'value': val}]
        for key, val in res.headers.items()
    }


def remove_disallowed_headers(headers):
    return {
        key: val
        for key, val in headers.items()
        if not is_blacklisted_or_readonly_header(key)
    }


def split_payload(data):
    cursor = 0
    payloads = []

    while True:
        if len(data[cursor:]) <= CACHE_PAYLOAD_SIZE_LIMIT:
            payloads.append(data[cursor:])
            break
        else:
            payloads.append(data[cursor:cursor + CACHE_PAYLOAD_SIZE_LIMIT])
            cursor += CACHE_PAYLOAD_SIZE_LIMIT

    while len(payloads) < NUM_SPLIT_MAX:
        payloads.append('')

    return payloads


def lambda_handler(event, context):
    cloud_front_event = event['Records'][0]['cf']
    request = cloud_front_event['request']

    if request['uri'] == GRAPHQL_ENDPOINT:
        if request['method'] == 'POST':
            protocol = 'https'
            data = request['body']['data']
            payloads = split_payload(data)

            if len(payloads) > NUM_SPLIT_MAX:
                return request

            headers = {f'Payload{i}': payloads[i]
                       for i in range(NUM_SPLIT_MAX)}
            res = http_request(
                f'{protocol}://{SITE_DOMAIN}{GRAPHQL_ENDPOINT}', headers=headers)
            print(f"==== HttpResponse from {SITE_DOMAIN}: \n{res}")
            return res

        elif request['method'] == 'GET':
            protocol = 'http'
            headers_obj = request.get('headers', {})

            required_headers = [f'payload{i}' for i in range(NUM_SPLIT_MAX)]
            if not all(h in headers_obj for h in required_headers):
                return request

            payload = ''.join(headers_obj[h][0]['value']
                              for h in required_headers)
            data = base64.b64decode(payload)

            headers = {
                'Content-Type': 'application/json',
                'Content-Length': str(len(data)),
            }

            res = http_request(f'{protocol}://{ORIGIN_DOMAIN}{GRAPHQL_ENDPOINT}',
                               method='POST', data=data, headers=headers)
            print(f"==== HttpResponse from {ORIGIN_DOMAIN}: \n{res}")
            return res

    return request
