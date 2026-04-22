const http = require('http');

const CONFIG = {
    HOST: 'localhost',
    PORT: 3001,
};

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);

    if (req.url === '/job' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const jobId = Math.random().toString(36).substring(2, 15);
        processJob(jobId);
        res.end(JSON.stringify({ time: new Date().toISOString(), jobId }));
        return;
    }

    if (req.url.startsWith('/job/') && req.method === 'GET') {
        const jobId = req.url.split('/')[2];
        const isPending = jobs.includes(jobId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            time: new Date().toISOString(),
            jobId,
            status: isPending ? 'pending' : 'completed'
        }));
        return;
    }

    if (req.url === '/time' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ time: new Date().toISOString() }));
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

const jobs = [];
function processJob(jobId) {
    jobs.push(jobId);
    setTimeout(() => {
        jobs.splice(jobs.indexOf(jobId), 1);
    }, Math.floor(Math.random(0, 10) * 1000));
}

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
    console.log(`\n🚀 Servidor corriendo en http://${CONFIG.HOST}:${CONFIG.PORT}`);
    console.log(`\n📌 Endpoints:`);
    console.log(`   - GET  /time     → Obtener la hora actual`);
});