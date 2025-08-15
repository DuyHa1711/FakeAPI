Dùng lệnh sau để chạy chương trình trong terminal

node server.js

Sau đó mở Postman hoặc tải extension Lightning để gọi API thử

vdu gọi thử một phát trong file

POST
http://localhost:3000/v1/api/auth/login
truyền vào body như sau

{
  "baseInfo": {
    "appCode": "string",
    "language": "string",
    "deviceId": "string",
    "deviceName": "string",
    "appVersion": "string",
    "deviceOsVersion": "string"
  },
  "wsRequest": {
    "username": "user1",
    "password": "pass1"
  }

thì postman sẽ hiện
Status: 200 OK    Size: 243 Bytes    Time: 10 ms

  {
  "code": 1073741824,
  "message": "Login successful",
  "wsResponse": {
    "role": "student",
    "accesstoken": "e4029e58a390396cf998399dc3237c9731171c862bb93373b90fadc23654f32b",
    "refreshtoken": "213f10ace66effbf0a1de94294adae7a480826f2fc1694df3f1b4e18a35797c9"
  }
}
