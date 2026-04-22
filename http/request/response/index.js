const net = require('net');
let counter = 0;

const server = net.createServer((socket) => {
    console.log('New connection established');
    counter = counter + 1;

    const connectionStart = Date.now(); // Guardar el tiempo de inicio de la conexión

    // Configurar timeout para conexiones inactivas
    socket.setTimeout(5000); // 5 segundos de inactividad

    socket.on('timeout', () => {
        console.log('Socket timed out due to inactivity');
        socket.end(); // Cierra la conexión
    });

    socket.on('data', (data) => {
        console.log('Raw request data:', data.toString());

        // Respuesta HTTP básica con Connection: keep-alive
        const response = `HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 13
Connection: keep-alive

Hello, World!`;

        socket.write(response);
        // No cerramos la conexión explícitamente para observar el timeout
    });

    socket.on('end', () => {
        console.log('Connection ended by client');
        counter = counter - 1;
    });

    socket.on('close', () => {
        const connectionEnd = Date.now(); // Guardar el tiempo de cierre de la conexión
        const duration = (connectionEnd - connectionStart) / 1000; // Duración en segundos
        console.log(`Connection closed. Duration: ${duration} seconds`);
        counter = counter - 1;
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });

    console.log(`Active connections: ${counter}`);
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});