import http from "http";

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/lessons/topics/8ae4a05c-be58-43da-b93e-8b3f1a6712e1/content',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("API Response:", data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
