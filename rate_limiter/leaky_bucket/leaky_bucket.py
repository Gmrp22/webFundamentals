
## We need a bucket, so a data structure to store our requests.

## we need a rate

##we need a function that manages the bucket
import time


bucket = []

rate = 2 ## tow by second

capacity = 5 ## max requests



def newRequests(request):
    if len(bucket) > 5:
        print('ignore request:', request)
    else:
        print('accept request:', request)
        bucket.append(request)
        

def processRequest():
    if len(bucket) > 0:
       del bucket[:2]
    else:
        print('empty bucket')


for i in range(7):
    newRequests(i)

while len(bucket)>1:
    time.sleep(1)
    print(bucket)
    processRequest()


            

