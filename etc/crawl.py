import urllib.request

import json
def crawl(url):
    response = urllib.request.urlopen(url)
    data = json.loads(response.read().decode('utf-8'))
    
    return (data)
print(crawl('data/taipei-attractions.json'))