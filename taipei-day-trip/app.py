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

mycursor = mydb.cursor(buffered=True)

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
    mrt: Optional[str] = None
    images: List[HttpUrl]
    

class Response_list(BaseModel):
	nextPage: Optional[int] = None
	data: List[Page_content]

class Response_model(BaseModel):
	data: Page_content

class Station_spot(BaseModel):
	data: List[str]

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

records_per_page = 12
@app.get("/api/attractions", response_model=Response_list)
async def api_attract(page: int = Query(0, ge = 0), keyword: Optional[str] = Query(None)):
    if keyword:
        mycursor.execute("SELECT COUNT(*) FROM website.turist_spot WHERE name LIKE %s OR mrt LIKE %s", ('%' + keyword + '%','%' + keyword + '%'))
        total_records = mycursor.fetchone()[0]
        max_page = math.ceil(total_records / float(records_per_page)) -1
        print("total_records=",total_records)
        print("max_page=",max_page)
        offset = page * records_per_page
        sql = """
        SELECT id, name, category, description, address, transport, mrt, lat, lng, image
        FROM turist_spot 
        WHERE name LIKE %s OR mrt LIKE %s
        LIMIT %s OFFSET %s
        """
        values = (('%' + keyword + '%'),('%' + keyword + '%'),records_per_page, offset)
        mycursor.execute(sql, values)
        rows = mycursor.fetchall()
    else:
        mycursor.execute("SELECT COUNT(*) FROM website.turist_spot")
        total_records = mycursor.fetchone()[0]
        max_page = math.ceil(total_records / float(records_per_page)) -1
        print("total_records=",total_records)
        print("max_page=",max_page)
        offset = page * records_per_page
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

    if page < max_page :
          nextPage = page+1
    elif page == max_page :
          nextPage = None
    else:
          raise HTTPException(status_code = 500)

    return Response_list(nextPage = nextPage, data = results)

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
