from fastapi import FastAPI, Request, Path, Query, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import mysql.connector
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import json
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import math

app=FastAPI()
mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    password="test",
    database="website"
)

mycursor = mydb.cursor()

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")
@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")
@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")

#---------------------------------------------------------------------------
#第一題，處理頁面和關鍵字檢索

class Page_content(BaseModel):
    id: int
    name: str
    category: str
    description: str
    address: str
    transport: str
    lat: float
    lng: float
    mrt: str
    images: List[HttpUrl]
    

class Response_list(BaseModel):
	next_page: int
	data: List[Page_content]

class Response_model(BaseModel):
	data: Page_content

class Error_message(BaseModel):
	error: bool
	message: str

class Station_spot(BaseModel):
	data: List[str]

mycursor.execute("SELECT COUNT(*) FROM website.turist_spot")
total_records = mycursor.fetchone()[0]
records_per_page = 12
page = 1 
max_page = math.ceil(total_records / records_per_page)

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    print(f"Handling HTTPException with status code: {exc.status_code}")
    if exc.status_code == 400:
        return JSONResponse(
            status_code=400,
            content={"error": True, "message": "景點編號不正確"}
        )
    elif exc.status_code == 500:
        return JSONResponse(
            status_code=500,
            content={"error": True, "message": "伺服器內部錯誤，請稍後再試。"}
        )

@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    print("Handling RequestValidationError")
    return JSONResponse(
        status_code=422,
        content={"error": True, "message": "請求參數錯誤"}
    )

@app.get("/api/attractions", response_model=Response_list)
async def api_attract(page: int = Query(lt = max_page+1, gt = 0), keyword: Optional[str] = Query(None)):
        if keyword:
            sql = """
            SELECT id, name, category, description, address, transport, mrt, lat, lng, image
            FROM turist_spot 
            WHERE name LIKE %s 
            """
            values = ('%' + keyword + '%',)
            mycursor.execute(sql, values)
        else:
            offset = (page - 1) * records_per_page
            sql = """
            SELECT id, name, category, description, address, transport, mrt, lat, lng, image
            FROM turist_spot 
            LIMIT %s OFFSET %s
            """
            mycursor.execute(sql, (records_per_page, offset))
        
        rows = mycursor.fetchall()

        results = [
            Page_content(
                id=row[0],
                name=row[1],
                category=row[2],
                description=row[3],
                address=row[4],
                transport=row[5],
                mrt=row[6],
                lat=row[7],
                lng=row[8],
                images=json.loads(row[9])
            ) for row in rows
        ]

        return Response_list(next_page = page+1, data = results)

@app.get("/api/attraction/{attractionId}", response_model=Response_model)
async def api_attractid(attractionId: int = Path(...)):
	sql = """
		SELECT id, name, category, description, address, transport, mrt, lat, lng, image 
		FROM turist_spot 
		WHERE id = %s
		"""
	values = (attractionId,)
	mycursor.execute(sql, values)
	row = mycursor.fetchone()

	if row:
		results = Page_content(
			id=row[0],
            name=row[1],
            category=row[2],
            description=row[3],
            address=row[4],
            transport=row[5],
            mrt=row[6],
            lat=row[7],
            lng=row[8],
            images=json.loads(row[9])
		)
		return Response_model(data = results)
	elif not row:
		raise HTTPException(status_code = 400)
	else:
		raise HTTPException(status_code = 500)

@app.get("/api/mrts", response_model=Station_spot)
async def api_mrts():
    sql = """
        SELECT mrt_station
        FROM website.turist_spot_mrt
        GROUP BY mrt_station
        ORDER BY COUNT(*) DESC;
    """
    mycursor.execute(sql)
    stations = mycursor.fetchall()
    # print(stations)
    if stations:
        station_names = [station[0] for station in stations]
        return Station_spot(data=station_names)
    else:
        raise HTTPException(status_code=500)
