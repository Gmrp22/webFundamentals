// const fetch = require('node-fetch');
// const http = require('http');

// // Crear un agente HTTP con keep-alive activado
// const agent = new http.Agent({
//     keepAlive: true, // Mantener la conexión abierta
// });

// async function makeRequest() {
//     const response = await fetch('http://localhost:3000/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'text/plain',
//         },
//         body: 'Hello, this is a test',
//         agent, // Usar el agente con keep-alive
//     });

//     const data = await response.text();
//     console.log('Response:', data);
// }

// makeRequest();

const http = require('http');

const agent = new http.Agent({ keepAlive: true ,  maxSockets: 1});

for (let i = 0; i < 3; i++) {
  http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'POST',
    agent
  }, res => {
    res.on('data', () => {});
  }).end('hello');
}
