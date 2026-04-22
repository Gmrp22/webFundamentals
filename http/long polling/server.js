const http = require('http');
const jobs = {};
const server = http.createServer();


server.on('request', (req, res) => {
    if (req.url === '/job' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const jobId = Math.random().toString(36).substring(2, 15);
        processJob(jobId);
        res.end(JSON.stringify({ time: new Date().toISOString(), jobId }));
        return;
    }

    if (req.url.startsWith('/job/') && req.method === 'GET') {
        const jobId = req.url.split('/')[2];
        waitForJob(jobId, (result) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ time: new Date().toISOString(), jobId, status: 'completed', result }));
        });
        return;
    }
});

function processJob(jobId) {
    jobs[jobId] = 'pending';
    setTimeout(() => {
        console.log(`Job ${jobId} completed`);
        jobs[jobId] = 'completed';
    }, Math.floor(Math.random() * 20000));
}

function waitForJob(jobId, callback) {
    const interval = setInterval(() => {
        if (jobs[jobId] === 'completed') {
            clearInterval(interval);
            callback(jobs[jobId]);
        }
    }, 500); // revisa cada 500ms
}

server.listen(3001, () => {
    console.log('Server running at http://localhost:3001');
});