
import asyncio

bucket = []
rate = 2
capacity = 5



def newRequest(request):
    if len(bucket) < capacity:
        bucket.append(request)


async def processRequest():
    print(bucket)
    if len(bucket) > 0:
        await asyncio.sleep(1)
        del bucket[:2]
    

async def main():
    x = True
    for i in range(7):
        newRequest(i)
    while(x == True):
        await processRequest()
        if len(bucket) == 0:
            x = False


asyncio.run(main())