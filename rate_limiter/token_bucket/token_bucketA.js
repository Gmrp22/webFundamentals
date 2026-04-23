//bucket con capacidad de tokens
//rate de generador de tokens
//request
//process

let bucket = []
let bucketCapacity = 5
let rate = 2000 //ms



function generateRequests() {
    let requests = Array.from({ length: 5 }, () => `req_${Math.floor(Math.random() * 100)}`)
    return requests
}

async function processRequests() {
    return new Promise(resolve => {
        if (bucket.length > 0) {
            setTimeout(() => {
                bucket.shift()
                console.log('request processed', bucket)
                resolve()
            }, 1000)
        }
        else {
            console.log('no tokens available')
            resolve()
        }
    })
}

function generateTokens() {
    if (bucket.length == 5) return
    if (bucket.length == (bucketCapacity - 1)) {
        //generate 1
        bucket.push('token')
        return
    }
    bucket.push('token', 'token')
}


async function main() {
    setInterval(() => {
        generateTokens()
    }, 1000)
    setInterval(() => {
        processRequests().then(() => {
            console.log(bucket)
        })

    }, 1000)

}

await main()