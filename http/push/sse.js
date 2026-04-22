const http = require('http');

const CONFIG = {
    HOST: 'localhost',
    PORT: 3001,
};

// Array para guardar las conexiones de clientes
const clients = [];

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);

    // Endpoint para SSE (Server-Sent Events)
    if (req.url === '/events') {
        // 1. Configurar headers para SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream', // Tipo de contenido para SSE
            'Cache-Control': 'no-cache',         // No cachear
            'Connection': 'keep-alive',          // Mantener conexión abierta
            'Access-Control-Allow-Origin': '*',  // CORS
        });

        // 2. Enviar un mensaje inicial de conexión
        res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Conectado al servidor de notificaciones' })}\n\n`);

        // 3. Guardar la conexión del cliente
        const clientId = Date.now();
        const newClient = {
            id: clientId,
            res: res,
        };
        clients.push(newClient);
        console.log(`Cliente ${clientId} conectado. Total: ${clients.length}`);

        // 4. Manejar cuando el cliente se desconecta
        req.on('close', () => {
            console.log(`Cliente ${clientId} desconectado`);
            const index = clients.findIndex(c => c.id === clientId);
            if (index !== -1) {
                clients.splice(index, 1);
            }
            console.log(`Clientes restantes: ${clients.length}`);
        });

        return;
    }

    // Endpoint para enviar una notificación a todos los clientes
    if (req.url === '/send' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            const notification = JSON.parse(body);
            console.log('Enviando notificación:', notification);

            // Enviar la notificación a todos los clientes conectados
            clients.forEach(client => {
                client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, clientsNotified: clients.length }));
        });

        return;
    }

    // Página principal con el cliente SSE
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Push Notifications Demo</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    #notifications { 
                        border: 1px solid #ccc; 
                        padding: 10px; 
                        height: 300px; 
                        overflow-y: auto;
                        background: #f9f9f9;
                    }
                    .notification {
                        padding: 10px;
                        margin: 5px 0;
                        background: #e3f2fd;
                        border-radius: 5px;
                    }
                    .status { color: green; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>🔔 Push Notifications Demo</h1>
                <p class="status" id="status">Desconectado</p>
                <h3>Notificaciones recibidas:</h3>
                <div id="notifications"></div>

                <script>
                    const statusEl = document.getElementById('status');
                    const notificationsEl = document.getElementById('notifications');

                    // Conectar al servidor SSE
                    const eventSource = new EventSource('/events');

                    eventSource.onopen = () => {
                        statusEl.textContent = '✅ Conectado';
                        statusEl.style.color = 'green';
                    };

                    eventSource.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        console.log('Notificación recibida:', data);

                        const div = document.createElement('div');
                        div.className = 'notification';
                        div.innerHTML = '<strong>' + (data.title || 'Notificación') + '</strong><br>' + (data.message || JSON.stringify(data));
                        notificationsEl.prepend(div);
                    };

                    eventSource.onerror = () => {
                        statusEl.textContent = '❌ Desconectado';
                        statusEl.style.color = 'red';
                    };
                </script>
            </body>
            </html>
        `);
        return;
    }

    // 404 para otras rutas
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
    console.log(`\n🚀 Servidor SSE corriendo en http://${CONFIG.HOST}:${CONFIG.PORT}`);
    console.log(`\n📌 Endpoints:`);
    console.log(`   - GET  /         → Página con cliente SSE`);
    console.log(`   - GET  /events   → Conexión SSE`);
    console.log(`   - POST /send     → Enviar notificación a todos los clientes`);
    console.log(`\n📤 Para enviar una notificación usa:`);
    console.log(`   curl -X POST http://localhost:${CONFIG.PORT}/send -H "Content-Type: application/json" -d '{"title":"Hola","message":"Esta es una notificación"}'`);
});
