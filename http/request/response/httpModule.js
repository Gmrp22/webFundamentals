const http = require('http');

const server = http.createServer((req, res) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    res.end('Hello, World!');
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});