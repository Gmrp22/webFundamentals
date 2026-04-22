const http = require('http');
const { WebSocketServer } = require('ws');

const SERVER_CONFIG = {
    HOST: 'localhost',
    PORT: 3000,
    KEEP_ALIVE_TIMEOUT: 5000,
    HEADERS_TIMEOUT: 60000,
};

const connections = [];

// Crear servidor HTTP
const server = http.createServer((req, res) => {
    console.log(`\nHTTP REQUEST: ${req.method} ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server running\n');
});

// Crear servidor WebSocket
const wss = new WebSocketServer({ server });

// Evento 'connection' (no 'request')
wss.on('connection', (ws, req) => {
    console.log(`\n✅ Nueva conexión desde: ${req.socket.remoteAddress}:${req.socket.remotePort}`);
    
    // Agregar conexión al array
    connections.push(ws);
    console.log(`👥 Conexiones activas: ${connections.length}`);

    // Escuchar mensajes
    ws.on('message', (data) => {
        const message = data.toString();
        console.log(`📨 Mensaje recibido: ${message}`);
        
        // Broadcast a todas las conexiones
        connections.forEach(conn => {
            if (conn.readyState === 1) { // 1 = OPEN
                conn.send(`Usuario dice: ${message}`);
            }
        });
    });

    // Manejar cierre de conexión
    ws.on('close', () => {
        console.log('❌ WebSocket connection closed');
        // Remover del array
        const index = connections.indexOf(ws);
        if (index > -1) {
            connections.splice(index, 1);
        }
        console.log(`👥 Conexiones activas: ${connections.length}`);
    });

    // Manejar errores
    ws.on('error', (error) => {
        console.error('⚠️ WebSocket error:', error);
    });
});

server.listen(SERVER_CONFIG.PORT, SERVER_CONFIG.HOST, () => {
    console.log(`\n🚀 Server running at http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`);
    console.log(`🔌 WebSocket ready at ws://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`);
});

server.keepAliveTimeout = SERVER_CONFIG.KEEP_ALIVE_TIMEOUT;
server.headersTimeout = SERVER_CONFIG.HEADERS_TIMEOUT;