const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Đọc db.json
const dbPath = path.join(__dirname, 'db.json');
let db;
try {
  const rawData = fs.readFileSync(dbPath);
  db = JSON.parse(rawData);
} catch (err) {
  console.error('Không thể đọc db.json:', err.message);
  db = { auth: { users: [] } };
}

// Store token tạm thời (in-memory)
const tokensStore = new Map();
const refreshTokensStore = new Map(); // Thêm store riêng cho refresh tokens

// Tạo HTTP server
const server = http.createServer((req, res) => {
  // Xử lý CORS nếu cần
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Xử lý OPTIONS request (pre-flight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Kiểm tra route
  if (req.url === '/v1/api/auth/login' && req.method === 'POST') {
    // Xử lý đăng nhập
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        const { baseInfo, wsRequest } = requestData || {};
        
        // Kiểm tra request
        if (!wsRequest || !wsRequest.username || !wsRequest.password) {
          sendJsonResponse(res, 400, {
            code: 1073741824,
            message: "Missing username or password",
            wsResponse: {}
          });
          return;
        }
        
        const { username, password } = wsRequest;
        
        // Tìm user trong db.json
        const user = db.auth.users.find(u => 
          u.username === username && u.password === password
        );
        
        // Nếu không tìm thấy user hoặc sai mật khẩu
        if (!user) {
          sendJsonResponse(res, 400, {
            code: 1073741824,
            message: "Invalid credentials",
            wsResponse: {}
          });
          return;
        }
        
        // Tạo token đơn giản
        const accesstoken = crypto.randomBytes(32).toString('hex');
        const refreshtoken = crypto.randomBytes(32).toString('hex');
        
        // Lưu token vào store
        tokensStore.set(accesstoken, {
          userId: user.id,
          username: user.username,
          role: user.role
        });
        
        // Lưu refresh token
        refreshTokensStore.set(refreshtoken, {
          userId: user.id,
          username: user.username,
          role: user.role
        });
        
        // Trả về response thành công
        sendJsonResponse(res, 200, {
          code: 1073741824,
          message: "Login successful",
          wsResponse: {
            role: user.role,
            accesstoken,
            refreshtoken
          }
        });
      } catch (error) {
        sendJsonResponse(res, 400, {
          code: 1073741824,
          message: "Invalid request format",
          wsResponse: {}
        });
      }
    });
  } else if (req.url === '/v1/api/auth/logout' && req.method === 'POST') {
    // Xử lý đăng xuất
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        const { baseInfo, wsRequest } = requestData || {};
        
        // Kiểm tra request
        if (!wsRequest || !wsRequest.username || !wsRequest.authHeader) {
          sendJsonResponse(res, 400, {
            code: 1073741824,
            message: "Missing username or authHeader",
            wsResponse: {}
          });
          return;
        }
        
        const { username, authHeader } = wsRequest;
        
        // Kiểm tra token có tồn tại không
        if (tokensStore.has(authHeader)) {
          // Xóa token khỏi store
          tokensStore.delete(authHeader);
          
          // Trả về response thành công
          sendJsonResponse(res, 200, {
            code: 1073741824,
            message: "Logout successful",
            wsResponse: {}
          });
        } else {
          // Token không hợp lệ hoặc đã hết hạn
          sendJsonResponse(res, 400, {
            code: 1073741824,
            message: "Invalid or expired token",
            wsResponse: {}
          });
        }
      } catch (error) {
        sendJsonResponse(res, 400, {
          code: 1073741824,
          message: "Invalid request format",
          wsResponse: {}
        });
      }
    });
  } else if (req.url === '/v1/api/auth/refresh-token' && req.method === 'POST') {
    // Xử lý refresh token
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        const { refreshToken } = requestData || {};
        
        // Kiểm tra request
        if (!refreshToken) {
          sendJsonResponse(res, 400, {
            code: 1073741824,
            message: "Missing refresh token",
            wsResponse: {}
          });
          return;
        }
        
        // Kiểm tra refresh token có tồn tại không
        if (refreshTokensStore.has(refreshToken)) {
          const userData = refreshTokensStore.get(refreshToken);
          
          // Tạo access token mới
          const newAccessToken = crypto.randomBytes(32).toString('hex');
          
          // Lưu token mới vào store
          tokensStore.set(newAccessToken, {
            userId: userData.userId,
            username: userData.username,
            role: userData.role
          });
          
          // Trả về response thành công với token mới
          sendJsonResponse(res, 200, {
            code: 1073741824,
            message: "Token refreshed successfully",
            wsResponse: {
              accessToken: newAccessToken
            }
          });
        } else {
          // Refresh token không hợp lệ hoặc đã hết hạn
          sendJsonResponse(res, 400, {
            code: 1073741824,
            message: "Invalid or expired refresh token",
            wsResponse: {}
          });
        }
      } catch (error) {
        sendJsonResponse(res, 400, {
          code: 1073741824,
          message: "Invalid request format",
          wsResponse: {}
        });
      }
    });
  } else if (req.url === '/' && req.method === 'GET') {
    // Route mặc định
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server API đang chạy. Sử dụng POST /v1/api/auth/login để test');
  } else {
    // Route không tồn tại
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Hàm hỗ trợ gửi JSON response
function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Khởi động server
server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
