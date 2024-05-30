from fastapi import FastAPI, Request, Path, Query
from fastapi.responses import FileResponse, JSONResponse
import mysql.connector
from pydantic import BaseModel, HttpUrl
from typing import Optional, List

app = FastAPI()

mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    password="test",
    database="website"
)

mycursor = mydb.cursor()

app = FastAPI()

class Page_content(BaseModel):
    id: int
    name: str
    mrt: str
    images: List[HttpUrl]  # 確保這裡是URL列表
    description: str
    category: str
    address: str
    transport: str
    lat: float
    lng: float

class Response_list(BaseModel):
    data: List[Page_content]

# ... 其他模型和數據庫代碼 ...

@app.get("/api/attractions", response_model=Response_list)
async def api_attract(page: Optional[int] = Query(1), keyword: Optional[str] = Query(None)):
    if keyword:
        sql = """
        SELECT id, name, mrt, image, description, category, address, transport, lat, lng 
        FROM turist_spot 
        WHERE name LIKE %s 
        LIMIT %s OFFSET %s
        """
        values = ('%' + keyword + '%', records_per_page, (page - 1) * records_per_page)
        mycursor.execute(sql, values)
    else:
        offset = (page - 1) * records_per_page
        sql = """
        SELECT id, name, mrt, image, description, category, address, transport, lat, lng 
        FROM turist_spot 
        LIMIT %s OFFSET %s
        """
        mycursor.execute(sql, (records_per_page, offset))
    
    rows = mycursor.fetchall()


    results = [Page_content(
        id=row[0],
        name=row[1],
        mrt=row[2],
        images=[row[3]],  # 將圖像URL轉換為列表
        description=row[4],
        category=row[5],
        address=row[6],
        transport=row[7],
        lat=row[8],
        lng=row[9]
    ) for row in rows]

    return Response_list(data=results)
