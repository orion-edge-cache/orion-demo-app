import https from "https";
import http from "http";
import { isBlacklistedOrReadonlyHeader } from "./disallowed_headers.mjs";

const CACHE_PAYLOAD_SIZE_LIMIT = 1783;
const NUM_SPLIT_MAX = 5;

const GRAPHQL_ENDPOINT = "/graphql";
const SITE_DOMAIN = "vfa102.xyz";
const ORIGIN_DOMAIN = "ec2-54-165-253-142.compute-1.amazonaws.com";

/**
 * Executes an HTTP(S) request.
 * Returns an object compatible with CloudFront Lambda@Edge response format.
 */
function httpRequest(
  endpoint,
  { method = "GET", headers = {}, data = null } = {},
) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const isHttps = url.protocol === "https:";
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
    };
    // console.log(
    //   "=== HTTP_REQUEST OPTIONS ===",
    //   JSON.stringify(options, null, 2),
    // );

    const req = (isHttps ? https : http).request(options, (res) => {
      let chunks = [];

      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        const headers = responseHeaders(res);

        resolve({
          status: String(res.statusCode),
          headers: removeDisallowedHeaders(headers),
          body,
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (data) req.write(data);
    req.end();
  });
}

/**
 * Converts Node.js response headers to CloudFront-compatible format.
 */
function responseHeaders(res) {
  const headers = {};
  for (const [key, value] of Object.entries(res.headers)) {
    headers[key.toLowerCase()] = [
      { key, value: Array.isArray(value) ? value.join(", ") : value },
    ];
  }
  return headers;
}

/**
 * Remove headers that are not allowed in Lambda@Edge.
 */
function removeDisallowedHeaders(headers) {
  const filtered = {};
  for (const [key, val] of Object.entries(headers)) {
    if (!isBlacklistedOrReadonlyHeader(key)) filtered[key] = val;
  }
  return filtered;
}

/**
 * Split payload into multiple header-sized chunks.
 */
function splitPayload(data) {
  const payloads = [];
  let cursor = 0;

  while (cursor < data.length) {
    payloads.push(data.slice(cursor, cursor + CACHE_PAYLOAD_SIZE_LIMIT));
    cursor += CACHE_PAYLOAD_SIZE_LIMIT;
  }

  while (payloads.length < NUM_SPLIT_MAX) payloads.push("");
  return payloads;
}

/**
 * Lambda@Edge handler
 */
export const handler = async (event, context, callback) => {
  const cf = event.Records[0].cf;
  const request = cf.request;

  if (request.uri === GRAPHQL_ENDPOINT) {
    // POST → GET (store payload in headers)
    if (request.method === "POST") {
      console.log(
        "=== Origin Request POST ===",
        JSON.stringify({
          method: request.method,
          uri: request.uri,
          headers: request.headers,
          queryString: request.querystring,
          bodyPresent: !!request.body,
          body: request.body
            ? Buffer.from(request.body.data, "base64").toString()
            : null,
        }),
      );

      const data = request.body?.data || "";
      const payloads = splitPayload(data);

      if (payloads.length > NUM_SPLIT_MAX) return request; // too large to cache

      const headers = {};
      payloads.forEach((chunk, i) => {
        headers[`Payload${i}`] = chunk;
      });

      const siteDomain = `${PROTOCOL}://${SITE_DOMAIN}${GRAPHQL_ENDPOINT}`;
      const requestPackage = {
        method: "GET",
        headers,
      };
      const httpResponse = await httpRequest(siteDomain, requestPackage);

      response.status = httpResponse.status;
      response.body = httpResponse.body;

      console.log(
        `==== Request Package for ${originDomain}`,
        JSON.stringify(requestPackage),
      );
      console.log(
        `==== HttpResponse from ${siteDomain}`,
        JSON.stringify(httpResponse),
      );
      console.log(
        `==== Response from ${originDomain}`,
        JSON.stringify(response),
      );

      return callback(null, response);
    }

    // GET → POST (rebuild from payload headers)
    else if (request.method === "GET") {
      console.log(
        "=== Origin Request GET ===",
        JSON.stringify({
          method: request.method,
          uri: request.uri,
          headers: request.headers,
          queryString: request.querystring,
          bodyPresent: !!request.body,
          body: request.body
            ? Buffer.from(request.body.data, "base64").toString()
            : null,
        }),
      );

      const payloadKeys = Array.from(
        { length: NUM_SPLIT_MAX },
        (_, i) => `payload${i}`,
      );
      if (!payloadKeys.every((key) => request.headers[key])) return request;

      const payload = payloadKeys
        .map((key) => request.headers[key]?.[0]?.value || "")
        .join("");

      const data = Buffer.from(payload, "base64");

      const headers = {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      };

      const originDomain = `${PROTOCOL}://${ORIGIN_DOMAIN}${GRAPHQL_ENDPOINT}`;
      const requestPackage = {
        method: "POST",
        data,
        headers,
      };
      const httpResponse = await httpRequest(
        `${PROTOCOL}://${ORIGIN_DOMAIN}${GRAPHQL_ENDPOINT}`,
        requestPackage,
      );

      const httpResponse = await httpRequest(siteDomain, requestPackage);

      response.status = httpResponse.status;
      response.body = httpResponse.body;

      console.log(
        `==== Request Package for ${originDomain}`,
        JSON.stringify(requestPackage),
      );
      console.log(
        `==== HttpResponse from ${originDomain}`,
        JSON.stringify(httpResponse),
      );
      console.log(
        `==== Response from ${originDomain}`,
        JSON.stringify(response),
      );

      return callback(null, response);
    }
  }

  // passthrough if not matching /queries
  return request;
};
