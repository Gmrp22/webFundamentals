
let bucket = [];
let rate = 2;
let capacity = 5;

async function processRequests() {
    console.log(bucket)
    if (bucket.length > 0) {
        return new Promise((resolve) => {
            setTimeout(() => {
                bucket.splice(0, rate);
                resolve();
            }, 1000);
        })
    }
}

function newRequests(request) {
    if (bucket.length > capacity) {
        console.log('ignore request:', request);
        return;
    }
    bucket.push(request)
}





async function main() {
    let c = true
    while (c) {
        await processRequests();
        if (bucket.length === 0) {
            c = false
        }
    }


}


try {
    for (let x = 0; x < 7; x++) {
        newRequests(x);
    }
    main();
} catch (error) {
    console.log(error);
}
//timers/promises