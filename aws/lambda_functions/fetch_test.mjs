import http from "http";

const GRAPHQL_ENDPOINT = "/graphql";
const SITE_DOMAIN = "vfa102.xyz";
const ORIGIN_DOMAIN = "ec2-54-165-253-142.compute-1.amazonaws.com";
const protocol = "http";

let query = { query: "query GetUsers {users { id name email }}" };
let queryString = JSON.stringify(query);
let contentLength = queryString.length;

let url = `${protocol}://${ORIGIN_DOMAIN}${GRAPHQL_ENDPOINT}`;
let options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": contentLength,
    "x-home-header": "This is from home",
  },
  body: queryString,
};

// console.log("Beginning Fetch");

// fetch(url, options)
//   .then((res) => console.log(res.text()))
//   .catch((err) => console.log("A fetch error occured", err));

// try {
//   const response = await fetch(url, options);
//   const text = await response.text();
//   console.log(text);
// } catch (err) {
//   console.log("A fetch error occured:", err);
// }

url = new URL(url);

options = {
  ...options,
  hostname: url.hostname,
  port: 80,
  path: url.pathname + url.search,
};

const reqPromise = new Promise((resolve, reject) => {
  const req = http.request(options, (res) => {
    let chunks = [];
    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf-8");
      console.log(`\nBODY: ${body}\nHeaders: ${JSON.stringify(res.headers)}`);
      resolve({
        status: res.status,
        body,
        headers: res.headers,
      });
    });
  });

  req.on("error", (err) => console.log("A http error occured:", err));
  req.write(queryString);
  req.end();
});

const res = await reqPromise;
const text = await res.text();
console.log(text);

// let url = new URL('http://www.example.com/graphl')
// url
//   URL {
//     href: 'http://www.example.com/graphl',
//     origin: 'http://www.example.com',
//     protocol: 'http:',
//     username: '',
//     password: '',
//     host: 'www.example.com',
//     hostname: 'www.example.com',
//     port: '',
//     pathname: '/graphl',
//     search: '',
//     searchParams: URLSearchParams {},
//     hash: ''
//   }
