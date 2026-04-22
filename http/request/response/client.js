const net = require('net');

const client = net.createConnection({ port: 3000 }, () => {
    console.log('Connected to server');
    client.write(`POST / HTTP/1.1\r\nHost: localhost:3000\r\nContent-Type: text/plain\r\nContent-Length: 21\r\nConnection: keep-alive\r\n\r\nHello, this is a test`);
});

client.on('data', (data) => {
    console.log('Received:', data.toString());
    // No cerramos la conexión para observar el timeout del servidor
});

client.on('end', () => {
    console.log('Disconnected from server');
});

client.on('close', () => {
    console.log('Connection closed by server');
});