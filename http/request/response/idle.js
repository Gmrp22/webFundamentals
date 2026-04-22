const http = require('http');

const CONFIG = {
  HOST: 'localhost',
  PORT: 3000,
  KEEP_ALIVE_TIMEOUT: 5000,   // ⏱️ 5s de idle
  HEADERS_TIMEOUT: 6000,
};

const server = http.createServer((req, res) => {
  console.log(`\nHTTP REQUEST: ${req.method} ${req.url}`);

  // ─────── HTTP lifecycle ───────
  req.on('end', () => {
    console.log('→ Request body fully received');

    // RESPUESTA NORMAL
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Connection': 'keep-alive',
    });

    res.end('OK\n', () => {
      console.log('→ Response finished (request DONE)');
      console.log('→ Socket is now IDLE (keep-alive)');
    });
  });

  req.on('close', () => {
    console.log('→ HTTP request stream CLOSED (normal)');
  });
});

// ─────── TCP lifecycle ───────
server.on('connection', socket => {
  console.log('🟢 TCP OPEN');

  socket.on('close', () => {
    console.log('🔴 TCP CLOSED (idle timeout or client)');
  });
});

// ─────── Server config ───────
server.keepAliveTimeout = CONFIG.KEEP_ALIVE_TIMEOUT;
server.headersTimeout = CONFIG.HEADERS_TIMEOUT;

// ─────── Start ───────
server.listen(CONFIG.PORT, CONFIG.HOST, () => {
  console.log(`\nServer running at http://${CONFIG.HOST}:${CONFIG.PORT}`);
});
