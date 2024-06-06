import json
import mysql.connector
import re

mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    password="test",
    database="website",
    charset='utf8'
)

mycursor = mydb.cursor()

# 打開JSON檔案並讀取數據
with open('data/taipei-attractions.json', 'r', encoding='utf-8') as file:
    data = json.load(file)
    pretty_json = json.dumps(data, indent=4)
    #print(pretty_json)

for item in data['result']['results']:
    pattern = r'https:\/\/.*?\.(?:jpg|png)'
    urls = re.findall(pattern, item['file'], re.IGNORECASE)
    for url in urls:
        print(url)

url_pattern = r'https:\/\/.*?\.(?:jpg|png)'

for item in data['result']['results']:
    check_sql = "SELECT COUNT(*) FROM `website`.`turist_spot` WHERE name = %s"
    mycursor.execute(check_sql, (item["name"],))
    if mycursor.fetchone()[0]>0:
        pass
    else:
        #處理圖片連結
        urls = re.findall(url_pattern, item['file'], re.IGNORECASE)
        image_urls_json = json.dumps(urls)      

        sql = "INSERT INTO `website`.`turist_spot` (name, mrt, SERIAL_NO, image, description, category, address, transport, lat, lng) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        val = (item["name"], item["MRT"], item["SERIAL_NO"], image_urls_json, item["description"], item["CAT"], item["address"], item["direction"], item["latitude"], item["longitude"])
        mycursor.execute(sql, val)
        mydb.commit()

        turist_spot_id = mycursor.lastrowid

            #mrt_station_name = mrt_station_name.strip()
        if item["MRT"] == None:
            pass
        elif item["MRT"]:
            sql = "INSERT INTO `website`.`turist_spot_mrt` (turist_spot_id, mrt_station) VALUES (%s, %s)"
            val = (turist_spot_id, item["MRT"])
            mycursor.execute(sql, val)
            mydb.commit()
