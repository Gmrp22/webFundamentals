const express = require('express');
const app = express();
const file = require('fs');

// Middleware para parsear JSON en el body
app.use(express.json());

app.post('/', (req, res) => {
    const data = {
        body: req.body, // Cuerpo de la solicitud
        headers: req.headers, // Encabezados de la solicitud
        method: req.method, // Método HTTP
        url: req.url // URL de la solicitud
    };

    // Convertir todo el objeto a JSON
    const dataString = JSON.stringify(data, null, 2);

    // Escribir los datos en un archivo llamado t.txt
    file.appendFile('t.txt', dataString + '\n', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            res.status(500).json({ error: 'Failed to write to file' });
        } else {
            console.log('Data written to t.txt');
            res.json({ message: 'Data received and written to file' });
        }
    });
});

const server = app.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});

server.keepAliveTimeout = 5000; // 5 segundos para conexiones inactivas
server.headersTimeout = 60000; // 60 segundos para recibir encabezados
