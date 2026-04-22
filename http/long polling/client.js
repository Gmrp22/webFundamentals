fetch('http://localhost:3001/job', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        console.log('Job creado:', data.jobId);

        // 2. Hacer long poll — el fetch queda esperando hasta que el server responda
        return fetch(`http://localhost:3001/job/${data.jobId}`);
    })
    .then(res => res.json())
    .then(result => {
        console.log('Job completado:', result);
    });