import asyncio




bucket = []
bucket_capacity = 5
rate = 2000 #ms


async def process_requests():
    if len(bucket) == 0:
        return
    await asyncio.sleep(1)
    del bucket[:1]
    print('request processed', bucket)
    return


def generate_tokens():
    if len(bucket) == bucket_capacity:
        return
    if len(bucket) == (bucket_capacity - 1):
        bucket.append('token')
        return
    bucket.append('token')
    bucket.append('token')
    
    

async def main():
    while(True):
        generate_tokens()
        await process_requests()

asyncio.run(main())