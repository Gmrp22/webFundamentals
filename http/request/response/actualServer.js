const http = require('http');

const CONFIG = {
    HOST: 'localhost', // '0.0.0.0' = todas las interfaces, 'localhost' = solo local
    PORT: 3000, //port number for the server to listen on
    TIMEOUT: 5000, // Tiempo máximo que espera el servidor antes de cancelar una petición, entre solicitudes, antes o durante
    KEEP_ALIVE_TIMEOUT: 60000, // Tiempo máximo para mantener viva una conexión inactiva despues de completar una solicitud
    HEADERS_TIMEOUT: 65000, // Tiempo máximo para recibir todos los encabezados de una solicitud
    MAX_HEADERS_COUNT: 200, // Número máximo de encabezados permitidos en una solicitud
    MAX_HEADERS_SIZE: 8192 // Tamaño máximo en bytes de los encabezados de una solicitud
};

const server = http.createServer((req, res) => {
      // Headers de seguridad y configuración
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Powered-By', 'Mi Servidor Node.js');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Connection', 'keep-alive');
res.setHeader('Access-Control-Allow-Private-Network', 'true');
  // Configurar encabezados de CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir solicitudes desde cualquier origen
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Métodos permitidos
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Encabezados permitidos

  if (req.method === 'OPTIONS') {
      res.writeHead(204); // Sin contenido
      res.end();
      return;
  }

    console.log(`Request received: ${req.method} ${req.url}`);

    req.on('data', chunk => {
        console.log(`Received ${chunk.length} bytes of data.`);
    });

    req.on('end', () => {
        res.end('Bye!!');
        console.log('No more data in request.');
    });
    req.on('error', (err) => {
        console.error('Request error:', err);
    });
    req.on('close', () => {

        console.log('Request closed by client'); //el stream HTTP del request terminó y se cerró”
    });

});

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
    console.log(`Server running at http://${CONFIG.HOST}:${CONFIG.PORT}/`);
});
server.on('connection', socket => {
  console.log('TCP OPEN');

  socket.on('close', () => {
    console.log('TCP CLOSED');
  });
});

server.keepAliveTimeout = CONFIG.KEEP_ALIVE_TIMEOUT; 
server.headersTimeout = CONFIG.HEADERS_TIMEOUT; 
server.maxHeadersCount = CONFIG.MAX_HEADERS_COUNT; 
server.maxHeadersSize = CONFIG.MAX_HEADERS_SIZE;
server.timeout = CONFIG.TIMEOUT;