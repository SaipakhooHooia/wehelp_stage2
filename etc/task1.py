import json
import crawl

file1=crawl.crawl('https://padax.github.io/taipei-day-trip-resources/taipei-attractions-assignment-1')
file2=crawl.crawl('https://padax.github.io/taipei-day-trip-resources/taipei-attractions-assignment-2')

address_dict={}
#讀取檔案2的捷運站編碼和地址
#with open(file2,mode='r',encoding="utf-8") as file:
#    data1=json.load(file)
for item in file2['data']:
            #print("MRT:"+item['MRT'],"address:"+item["address"])
    address_dict[item['SERIAL_NO']]=item["address"]

"""{'文德': '臺北市  內湖區內湖路2段175號', 
'中正紀念堂': '臺北市  中正區中山南路21號', 
'關渡': '臺北市  北投區中央北路四段515巷16號', ...
"""

spot=[]#[['新北投溫泉區'], ['大稻埕碼頭'], ['士林官邸'], ['國立故宮博物院'],...]
longitude=[]
latitude=[]
location=[]
image=[]
location_buffer=[]
#檔案1
#取出景點跟站牌號碼
#with open(file1,mode='r',encoding="utf-8") as file:
#    data=json.load(file)
for item in file1['data']["results"]:
        #print("stitle:",i["stitle"])
    spot.append(item['stitle'])
    location_buffer.append(item['SERIAL_NO'])
#print(len(location_buffer))

#取出地區
for num in location_buffer:
    for key,value in address_dict.items():
        if num==key:
            location.append(value[5]+value[6]+value[7])

#print(location)
"""['北投區', '大同區', '士林區', '士林區', '北投區', '北投區', '北投區', '大安區', '北投區', '信義區', '萬華區', '中山區', '北投區', '中正區', '信義區', ' 文山區', '北投區', '北投區', '中正區', '中正區', '信義區', '中山區', '萬華區', '北投區', '大同區', '信義區', '士林區', '文山區', '內湖區', '士林區', '內 湖區', '中山區', '北投區', '士林區', '士林區', '大同區', '中山區', '中山區', '北投區', '文山區', '中正區', '士林區', '萬華區', '松山區', '北投區', '北投 區', '內湖區', '中正區', '士林區', '文山區', '中山區', '信義區', '大同區', '士林區', '北投區', '萬華區', '中正區', '萬華區']"""

#加上經緯度
for i in range(len(file1['data']["results"])):
    longitude.append(file1['data']["results"][i]["longitude"])#['121.508447', '121.508274', '121.530849'...
    latitude.append(file1['data']["results"][i]["latitude"])

#print(len(latitude))

#pic_url https://www.travel.taipei/pic/11000848.jpg
import re#正則表達式
#['https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000848.jpg', 'https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000340.jpg', 'https://www.travel.taipei/d_upload_ttn/sceneadmin/image/A0/B0/C0/D7/E150/F719/71eb4b56-f771-43bc-856c-2fb265a5cc6e.jpg',...

for i in range(len(file1['data']['results'])):
    url=file1['data']['results'][i]['filelist']
    pattern = r'https:\/\/.*?\.jpg'
    match = re.search(pattern, url, re.IGNORECASE)
    if match:
        first_image_url = match.group()
        image.append(first_image_url)

#print(image)

#將景點、地區、經緯度跟image加入csv
import csv
with open('spot.csv', mode='w', newline='', encoding='utf-8-sig') as csvfile:
    writer = csv.writer(csvfile)
    #writer.writerow(["SpotTitle","District","Longitude","Latitude","ImageURL"])
    for i in range(len(file1['data']['results'])):
        writer.writerow([spot[i], location[i],longitude[i],latitude[i],image[i]])

#以上處理完task第一題，接下來處理第二個mrt.csv
#打開第二個json檔

station_num={}
#with open(file2,mode='r',encoding="utf-8") as file:
#    data1=json.load(file)
for item in file2['data']:
    station_num[item['SERIAL_NO']]=item["MRT"]

#print("station_num_len=",len(station_num))#{'2011051800000646':'文德' , '2011051800000108':'中正紀念堂' , '2011051800000205':'關渡' , '西門': '2011051800000352', '松山': '2011051800000300', '北投': '2011051800000199', 

spot_dict={}
for i in range(len(spot)):#共58個景點
    if list(station_num.values())[i] in spot_dict.keys():#如果station_num.values()站牌名稱已經在spot_dict.keys()裡了
        spot_dict[list(station_num.values())[i]].append(file1['data']['results'][i]['stitle'])#spot_dict在該站牌名稱的key值裡新增景點名稱
    else:
        spot_dict[list(station_num.values())[i]]=[]#如果station_num.values()站牌名稱沒有在spot_dict.keys()裡，就新增這個站牌的key
        spot_dict[list(station_num.values())[i]].append(file1['data']['results'][i]['stitle'])#並且在該站牌名稱的key值裡新增景點名稱

#print(spot_dict)#{'文德': ['新北投溫泉區'], '中正紀念堂': ['大稻埕碼頭', '指南宮'], '關渡': ['士林官邸', '陽明山溫泉區', '陽明山國家公園', '雙溪生活水岸'], '西門': ['國立故宮博物院'], '松山': ['北投圖書館'], '北投': ['關渡、金色水岸、八里左岸自行車道'], '葫洲': ['大安森林公園'], '臺大醫院': ['地熱谷', '臺北市鄉土教育中心(剝皮寮歷史街區)'], '劍潭': ['南港山系-象山親山步道', '二格山系-指南宮貓空親山步道', '臺北市立動物園', '冷水坑溫泉區'], '木柵': ['艋舺龍山寺'], '忠孝新生': ['行天宮', '陽明山中山樓'], '市政府': ['梅庭', '臺北啤酒工廠(原建國啤酒廠)'], '圓山': ['中正紀念堂', '北投公園', '臺北忠烈祠'], '芝山': ['台北探索館'], '龍山寺': ['北投溫泉博物館', '內溝溪景觀生態步道', '華中河濱公園'], '公館': ['琉園水晶博物館(暫時休館)'], '新北投': ['華山1914文化創意產業園區', '新店溪、大漢溪與淡水河自行車道', '光點臺北', '關渡宮', '國立臺灣科學教育館', '大龍峒保安宮'], '雙連': ['長榮海事博物館', '台北當代藝術館'], '士林': ['台北101', '袖珍博物館', '景美溪左、右岸自行車道'], '大湖公園': ['台北霞海城隍廟'], '大直': ['國父紀念館'], '石牌': ['碧湖公園'], '中山': ['基隆河左、右岸親水', ' 大湖公園', '臺北市立美術館'], '忠義': ['關渡碼頭-甘豆門'], '動物園': ['社子島環島與二重疏洪道自行車道', '國立歷史博物館', '松山文創園區'], '松江南京': ['七星山系-天母古道親山步道'], '國父紀念館': ['行天宮北投分宮-忠義廟'], '唭哩岸': ['西門紅樓'], '大安森林公園': ['松山慈祐宮'], '象山': ['北投文物館'], '行天宮': ['二二八和平公園'], '台北101／世貿': ['自來水博物館']}

result_list = [[key] + value for key, value in spot_dict.items()]
#print(result_list)#為了加入CSV方便，還是將它變回了列表
#[['文德', '新北投溫泉區'], ['中正紀念堂', '大稻埕碼頭', '指南宮'], ['關渡', '士林官邸', '陽明山溫泉區', '陽明山國家公園', '雙溪生活水岸'],...

#將站牌名稱、景點加入csv
with open('mrt.csv', mode='w', newline='', encoding='utf-8-sig') as csvfile:
    writer = csv.writer(csvfile)
    #writer.writerow(['StationName','AttractionTitle1','AttractionTitle2','AttractionTitle3'])
    for i in range(len(result_list)): 
        writer.writerow([*result_list[i]])