from fastapi import FastAPI, Request, Path, Query, HTTPException, Depends, Body, Header
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
import mysql.connector
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, TypeVar, Generic
import json
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import math
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector.pooling import MySQLConnectionPool
import jwt
from datetime import datetime
import httpx

app=FastAPI()

mydb = {
    'host': 'localhost',
    'user': 'root',
    'password': 'test',
    'database': 'website'
    }

pool = MySQLConnectionPool(pool_name="mypool", pool_size=5, **mydb)

def get_db_conn():
    connection = pool.get_connection()
    mycursor = connection.cursor(buffered=True)
    try:
        yield mycursor, connection
    finally:
        mycursor.close()
        connection.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="static")

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

T = TypeVar('T')

class Response_model(BaseModel, Generic[T]):
    data: T

class Station_spot(BaseModel):
	data: List[str]
'''
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    print(f"Handling HTTPException with status code: {exc.status_code}")
    if exc.status_code == 400:
        return JSONResponse(
            status_code=400,
            content={"error": True, "message": "400 Bad Request"}
        )
    elif exc.status_code == 500:
        return JSONResponse(
            status_code=500,
            content={"error": True, "message": "500 internal server error"}
        )'''

@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    print("Handling RequestValidationError")
    return JSONResponse(
        status_code=422,
        content={"error": True, "message": "Input data incorrect."}
    )

records_per_page = 12

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("./static/favicon.ico")

@app.get("/api/attractions", response_model=Response_list)
async def api_attract(page: int = Query(0, ge = 0), keyword: Optional[str] = Query(None), db_conn = Depends(get_db_conn)):
    mycursor, connection = db_conn
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
async def api_attractid(attractionId: int = Path(...), db_conn = Depends(get_db_conn)):
    mycursor, connection = db_conn
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
        return Response_model(data=results)
    elif not row:
        raise HTTPException(status_code=400)
    else:
        raise HTTPException(status_code=500)

@app.get("/api/mrts", response_model = Station_spot)
async def api_mrts(db_conn = Depends(get_db_conn)):
    mycursor, connection = db_conn
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
#---------------------------------------------------------------------------
#處理登入介面和驗證
class Correct_message(BaseModel):
      ok: bool

class Error_message(BaseModel):
	error: bool
	message: str

class Signup_message(BaseModel):
      name: str
      email: str
      password: str
    
@app.post("/api/user")
async def signup(signup_data: Signup_message = Body(...), db_conn = Depends(get_db_conn)):
    mycursor, connection = db_conn
    mycursor.execute("SELECT COUNT(*) FROM website.member WHERE email = %s", (signup_data.email,))
    result_count = mycursor.fetchone()[0]
    print("result_count = ", result_count)
    if result_count > 0:
        error_message = "Email already been used"
        result = Error_message(
              error = True,
              message =   error_message
              )
        return result
    else:
        sql = "INSERT INTO `website`.`member` (name, email, password) VALUES (%s, %s, %s)"
        val = (signup_data.name, signup_data.email, signup_data.password)
        mycursor.execute(sql, val)
        connection.commit()
        result = Correct_message(
              ok = True
        )
        return result

class User_data(BaseModel):
      id: int
      name: str
      email: str

def user_data(email, db_conn):
    mycursor, connection = db_conn
    mycursor.execute("SELECT * FROM website.member WHERE email = %s", (email,))
    row = mycursor.fetchone()
    if row:
        result = User_data(
            id=row[0],
            name=row[1],
            email=row[2]
        )
        return result
    return None

def get_token_authorization(authorization: str):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=400, detail=Error_message(error=True, message="Illegal user.").model_dump())
    token = authorization.split("Bearer ")[1]
    try:
        payload = jwt.decode(token, "midori", algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail=Error_message(error=True, message="Token has expired.").model_dump())
    except jwt.DecodeError:
        raise HTTPException(status_code=403, detail=Error_message(error=True, message="Token decode failed.").model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=Error_message(error=True, message="500 internal server error.").model_dump())

@app.get("/api/user/auth")
async def auth(authorization: str = Header(...)):
    token = get_token_authorization(authorization)
    return token
    
class Login_message(BaseModel):
      email: str
      password: str

class Token(BaseModel):
     token: str

def password_verify(login_email, login_pwd, db_conn):
    mycursor, connection = db_conn
    mycursor.execute("SELECT password FROM website.member WHERE email = %s", (login_email,))
    password = mycursor.fetchone()
    if password[0] == login_pwd:
         return True
    else:
        return False

@app.put("/api/user/auth")
async def jwtauth(login_data: Login_message = Body(...), db_conn = Depends(get_db_conn)):
    user_data_result = user_data(login_data.email, db_conn)
    if user_data_result is None:
        error_message = "User not found"
        return Error_message(
            error=True,
            message=error_message
        )
    if password_verify(login_data.email, login_data.password, db_conn) == True:
        encoded_jwt = jwt.encode(user_data_result.model_dump(), "midori", algorithm="HS256")
        return Token(token = encoded_jwt)
    else:
        error_message = "Wrong email or password"
        return Error_message(
            error=True,
            message=error_message
        )

class AttractionInfo(BaseModel):
    id: int
    name: str
    address: str
    image: str

class BookingInfo(BaseModel):
     attraction: AttractionInfo
     date: str
     time: str
     price: int

@app.get("/api/booking")
async def booking(request: Request, db_conn = Depends(get_db_conn), authorization: str = Header(...)):
    token = get_token_authorization(authorization)
    try:
        if token:
            user_id = token["id"]
            mycursor, connection = db_conn
            mycursor.execute("SELECT attractionId, date, time, price FROM website.booking WHERE user_id = %s", (user_id,))
            row = mycursor.fetchone()
            if row:
                attractionId = row[0]
                date = row[1].strftime('%Y-%m-%d')
                time = row[2]
                price = row[3]
                mycursor.execute("SELECT id, name, address, image FROM website.turist_spot WHERE id = %s", (attractionId,))
                rowing = mycursor.fetchone()
                id = rowing[0]
                name = rowing[1]
                address = rowing[2]
                image = rowing[3]
                images_list = json.loads(image)
                first_image = images_list[0]

                info = AttractionInfo(
                        id = id,
                        name = name,
                        address = address,
                        image = first_image
                )
                result = BookingInfo(
                    attraction = info,
                    date = date,
                    time = time,
                    price = price
                )
                print("booking-get: ",Response_model(data=result))
                return Response_model(data=result)
            else:
                result = Error_message(
                error = True,
                message = "No booking data available."
            )
            return result
    except HTTPException as e:
        return e

class BookingRequest(BaseModel):
    attractionId: int
    date: str
    time: str
    price: int

@app.post("/api/booking")
async def create_booking(booking: BookingRequest, db_conn=Depends(get_db_conn), authorization: str = Header(...)):
    token = get_token_authorization(authorization)
    
    user_id = token["id"]
    mycursor, connection = db_conn
    select_sql = "SELECT id FROM `website`.`booking` WHERE user_id = %s"
    mycursor.execute(select_sql, (user_id,))
    existing_bookings = mycursor.fetchall()

    try:
        if existing_bookings:
            update_sql = """
            UPDATE `website`.`booking`
            SET attractionId = %s, date = %s, time = %s, price = %s
            WHERE user_id = %s
            """
            #for booking_id in existing_bookings:
            val = (booking.attractionId, booking.date, booking.time, booking.price, user_id)
            print("update data=",booking.attractionId, booking.date, booking.time, booking.price, user_id)
            mycursor.execute(update_sql, val)
            connection.commit()
            result = Correct_message(ok=True)
            return result
        else:
            sql = "INSERT INTO `website`.`booking` (attractionId, date, time, price, user_id) VALUES (%s, %s, %s, %s, %s)"
            val = (booking.attractionId, booking.date, booking.time, booking.price, user_id)
            mycursor.execute(sql, val)
            connection.commit()
            result = Correct_message(ok=True)
            return result
    except HTTPException as e:
        return e

@app.delete("/api/booking")
async def delete_booking(db_conn = Depends(get_db_conn), authorization: str = Header(...)):
    token = get_token_authorization(authorization)
    try:
        if token:
            mycursor, connection = db_conn
            user_id = token["id"]
            sql = "DELETE FROM website.booking WHERE user_id = %s"
            mycursor.execute(sql, (user_id,))
            connection.commit()
    except HTTPException as e:
        return e

class userData(BaseModel):
    name: str
    email: str
    phone: str
class tripContent(BaseModel):
    attraction: AttractionInfo
    date: str
    time: str
class orderContent(BaseModel):
    price: int
    trip: tripContent
    contact: userData
class orderRequest(BaseModel):
    prime: str
    order: orderContent

class orderSuccess(BaseModel):
    number: int
    payment: dict

@app.post("/api/orders")
async def order(orders: orderRequest, db_conn = Depends(get_db_conn), authorization: str = Header(...)):
    mycursor, connection = db_conn
    token = get_token_authorization(authorization)
    try:
        if token:
            user_id = token["id"]
            sql = "INSERT INTO `website`.`orders` (prime, price, attractionId, date, time, name, email, phone) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
            val = (orders.prime, orders.order.price, orders.order.trip.attraction.id, orders.order.trip.date, 
                orders.order.trip.time, orders.order.contact.name, orders.order.contact.email, orders.order.contact.phone)
            mycursor.execute(sql, val)
            connection.commit()
            partner_key = "partner_E4p9DMKDfKDeb5CdyRbADrzsgVcNJ9FJFEilR5RDgwt66W6qjteAYPy8"
            merchant_id = "tppf_MidoriTapPay_GP_POS_3"
            result_url = "http://3.90.232.77:8000/api/orders"

            select_sql = "SELECT id FROM `website`.`orders` WHERE prime = %s"
            val = (orders.prime,)
            mycursor.execute(select_sql, val)
            order_id = mycursor.fetchone()[0]

            payload = {
            "prime": orders.prime,
            "partner_key": partner_key,
            "merchant_id": merchant_id,
            "amount": orders.order.price,
            "order_number": str(order_id),
            "bank_transaction_id": str(order_id),  
            "details": "ATM",
            #"three_domain_secure": True,
            "cardholder": {
                "phone_number": orders.order.contact.phone,
                "name": orders.order.contact.name,
                "email": orders.order.contact.email
            },
            "result_url": {
                "backend_notify_url": result_url
            },
            "expire_in_days": 1
            }

            headers = {
                "Content-Type": "application/json",
                "x-api-key": partner_key
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime",
                    json=payload,
                    headers=headers
                )
            response_data = response.json()
        if response_data.get("status") == 0:
            sql = "UPDATE `website`.`orders` SET is_paid = %s, payment_result = %s WHERE prime = %s"
            val = (True, response_data["status"], orders.prime)
            mycursor.execute(sql, val)
            connection.commit()

            delete_sql = "DELETE FROM `website`.`booking` WHERE user_id = %s"
            val = (user_id,)
            mycursor.execute(delete_sql, val)
            connection.commit()
            result = orderSuccess(number = order_id, payment = {"status": response_data["status"],"message": "付款成功", "number":order_id})
            return Response_model(data = result)
        else:
            sql = "UPDATE `website`.`orders` SET is_paid = %s, payment_result = %s WHERE prime = %s"
            val = (False, response_data["status"], orders.prime)
            mycursor.execute(sql, val)
            connection.commit()
            raise HTTPException(status_code=400, detail=Error_message(error=True, message=response_data["msg"]).model_dump())
        
    except HTTPException as e:
        return e

class orderSearch(BaseModel):
    number:int
    price: int
    trip: dict
    contact: dict
    status: int

@app.get("/api/orders/{orderNumber}")
async def order(orderNumber: int = Path(...), db_conn = Depends(get_db_conn), authorization: str = Header(...)):
    mycursor, connection = db_conn
    token = get_token_authorization(authorization)
    try:
        if token:
            sql = "SELECT price, attractionId, date, time, name, email, phone, payment_result FROM website.orders WHERE id = %s"
            val = (orderNumber,)
            mycursor.execute(sql, val)
            row = mycursor.fetchone()

            sql2 = "SELECT name, address, image FROM website.turist_spot WHERE id = %s"
            val2 = (row[1],)
            mycursor.execute(sql2, val2)
            row2 = mycursor.fetchone()

            if row:
                result = orderSearch(
                    number = orderNumber,
                    price = row[0],
                    trip = {"attraction": {"id": row[1], "name": row2[0], "address": row2[1], "image": row2[2]}, "date": row[2], "time": row[3]},
                    contact = {"name": row[4], "email": row[5], "phone": row[6]},
                    status = row[7]
                )
                return Response_model(data = result)
            else:
               raise HTTPException(status_code=500, detail=Error_message(error=True, message="Search id out of range.").model_dump())  
    except HTTPException as e:
        return e
            
