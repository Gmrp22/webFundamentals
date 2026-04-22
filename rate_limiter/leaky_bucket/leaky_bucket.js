
let bucket = [];
let rate = 2;
let capacity = 5;

function processRequests() {
    if (bucket.length > 0) {
        bucket.splice(0, rate);
    }
}

function newRequests(request) {
    if (bucket.length > capacity) {
        console.log('ignore request:', request);
        return;
    }
    bucket.push(request)
}


for (let x = 0; x < 7; x++) {
    newRequests(x);

}


let timer = setInterval(() => {
    console.log('processing requests', bucket);
    processRequests();
    if (bucket.length === 0) {
        clearInterval(timer);
    }
}, 1000);

for (let x = 0; x < 7; x++) {
    newRequests(x + 2);

}


