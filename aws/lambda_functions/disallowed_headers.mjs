// Blacklisted headers from AWS Lambda@Edge restrictions
const BLACKLISTED_HEADERS = [
  "Connection",
  "Expect",
  "Keep-Alive",
  "Proxy-Authenticate",
  "Proxy-Authorization",
  "Proxy-Connection",
  "Trailer",
  "Upgrade",
  "X-Accel-Buffering",
  "X-Accel-Charset",
  "X-Accel-Limit-Rate",
  "X-Accel-Redirect",
  "X-Amzn-Auth",
  "X-Amzn-Cf-Billing",
  "X-Amzn-Cf-Id",
  "X-Amzn-Cf-Xff",
  "X-Amzn-Errortype",
  "X-Amzn-Fle-Profile",
  "X-Amzn-Header-Count",
  "X-Amzn-Header-Order",
  "X-Amzn-Lambda-Integration-Tag",
  "X-Amzn-RequestId",
  "X-Cache",
  "X-Forwarded-Proto",
  "X-Real-IP",
];

const READONLY_HEADERS = [
  "Accept-Encoding",
  "Content-Length",
  "If-Modified-Since",
  "If-None-Match",
  "If-Range",
  "If-Unmodified-Since",
  "Transfer-Encoding",
  "Via",
];

const lower = (arr) => arr.map((h) => h.toLowerCase());

const blacklisted = lower(BLACKLISTED_HEADERS);
const readonly = lower(READONLY_HEADERS);

export function isBlacklistedHeader(name) {
  const n = name.toLowerCase();
  // const pattern = /^x-(amz-cf|edge)-+/;
  const pattern = /^x-(amz-cf-|amzn-cf-|edge-)/;
  return blacklisted.includes(n) || pattern.test(n);
}

export function isReadonlyHeader(name) {
  return readonly.includes(name.toLowerCase());
}

export function isBlacklistedOrReadonlyHeader(name) {
  return isBlacklistedHeader(name) || isReadonlyHeader(name);
}
