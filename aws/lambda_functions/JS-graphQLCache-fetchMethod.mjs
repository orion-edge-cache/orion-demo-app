import { isBlacklistedOrReadonlyHeader } from "./disallowed_headers.mjs";

// Constants
const CACHE_PAYLOAD_SIZE_LIMIT = 1783;
const NUM_SPLIT_MAX = 5;

const GRAPHQL_ENDPOINT = "/graphql";
const SITE_DOMAIN = "vfa102.xyz";
const ORIGIN_DOMAIN = "ec2-54-165-253-142.compute-1.amazonaws.com";

// --- HTTP request helper ---
async function httpRequest(
  endpoint,
  { method = "GET", headers = {}, body = null } = {},
) {
  try {
    console.log(
      `=== Starting Fetch ===\n${JSON.stringify({ endpoint, method, headers, body })}`,
    );
    const res = await fetch(endpoint, { method, headers, body });
    console.log("=== Fetch complete");
    const resBody = await res.text();
    const resHeaders = responseHeaders(res.headers);

    const result = {
      status: String(res.status),
      headers: removeDisallowedHeaders(resHeaders),
      body: resBody,
    };
    console.log(`\n=== Fetch Result ===\n${JSON.stringify(result, null, 2)}`);
    return result;
  } catch (err) {
    console.log("A fetch error occured", err);
    const result = {
      status: String(400),
      headers: {},
      body: null,
    };
    return result;
  }
}

// --- Response header normalization ---
function responseHeaders(headers) {
  const result = {};
  for (const [key, val] of headers.entries()) {
    result[key.toLowerCase()] = [{ key, value: val }];
  }
  return result;
}

// --- Filter disallowed headers ---
function removeDisallowedHeaders(headers) {
  const result = {};
  for (const [key, val] of Object.entries(headers)) {
    if (!isBlacklistedOrReadonlyHeader(key)) {
      result[key] = val;
    }
  }
  return result;
}

// --- Split payload into smaller parts ---
function splitPayload(data) {
  let cursor = 0;
  const payloads = [];

  while (true) {
    const remaining = data.slice(cursor);
    if (remaining.length <= CACHE_PAYLOAD_SIZE_LIMIT) {
      payloads.push(remaining);
      break;
    } else {
      payloads.push(data.slice(cursor, cursor + CACHE_PAYLOAD_SIZE_LIMIT));
      cursor += CACHE_PAYLOAD_SIZE_LIMIT;
    }
  }

  while (payloads.length < NUM_SPLIT_MAX) {
    payloads.push("");
  }

  return payloads;
}

// --- Main Lambda handler ---
export async function handler(event, context, callback) {
  const cloudFrontEvent = event.Records[0].cf;
  const request = cloudFrontEvent.request;

  if (request.uri === GRAPHQL_ENDPOINT) {
    // --- POST request (client -> site domain) ---
    if (request.method === "POST") {
      console.log("=== Starting POST Conditional ===");
      const protocol = "https";
      const data = request.body?.data ?? "";
      const payloads = splitPayload(data);

      if (payloads.length > NUM_SPLIT_MAX) return request;

      const headers = {};
      for (let i = 0; i < NUM_SPLIT_MAX; i++) {
        headers[`Payload${i}`] = payloads[i];
      }

      const endpoint = `${protocol}://${SITE_DOMAIN}${GRAPHQL_ENDPOINT}`;
      const res = await httpRequest(endpoint, { headers });

      console.log(`==== HttpResponse from ${SITE_DOMAIN}:`, res);
      return callback(null, res);
    }

    // --- GET request (cache hit -> origin) ---
    if (request.method === "GET") {
      const protocol = "http";
      const headersObj = request.headers ?? {};
      console.log(
        `=== Starting GET Conditional ===\nHeaders: ${JSON.stringify(headersObj)}`,
      );

      const requiredHeaders = Array.from(
        { length: NUM_SPLIT_MAX },
        (_, i) => `payload${i}`,
      );
      if (!requiredHeaders.every((h) => headersObj[h])) {
        console.log("** Caution: Request did not have required headers **");
        return request;
      }

      const payload = requiredHeaders
        .map((h) => headersObj[h][0].value)
        .join("");
      const data = Buffer.from(payload, "base64");

      const headers = {
        "Content-Type": "application/json",
        "Content-Length": data.length.toString(),
      };

      const endpoint = `${protocol}://${ORIGIN_DOMAIN}${GRAPHQL_ENDPOINT}`;
      const res = await httpRequest(endpoint, {
        method: "POST",
        headers,
        body: data,
      });

      console.log(`==== HttpResponse from ${ORIGIN_DOMAIN}:`, res);
      return callback(null, res);
    }
  }

  return request;
}
