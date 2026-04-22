const http = require('http');
const { EventEmitter } = require('stream');
const jobs = {};
const server = http.createServer();
const jobsQue = new EventEmitter();

server.on('request', async (req, res) => {
    if (req.url === '/job' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const jobId = Math.random().toString(36).substring(2, 15);
        processJob(jobId);
        res.end(JSON.stringify({ time: new Date().toISOString(), jobId }));
        return;
    }

    if (req.url.startsWith('/job/') && req.method === 'GET') {
        const jobId = req.url.split('/')[2];
        const result = await waitForJob(jobId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ time: new Date().toISOString(), jobId, status: 'completed', result }));
        return;
    }
});

function processJob(jobId) {
    jobs[jobId] = 'pending';
    setTimeout(() => {
        console.log(`Job ${jobId} completed`);
        jobs[jobId] = 'completed';
        jobsQue.emit(`completed-${jobId}`);
    }, Math.floor(Math.random() * 20000));
}

async function waitForJob(jobId) {
    return new Promise((resolve) => {
        jobsQue.once(`completed-${jobId}`, () => {
            resolve(jobs[jobId]);
        });
    });
}

server.listen(3001, () => {
    console.log('Server running at http://localhost:3001');
});