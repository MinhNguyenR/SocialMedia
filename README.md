# SPCK Social Media App

## 📌 Giới thiệu
Đây là một dự án mạng xã hội (Social Media) full-stack với backend Node.js/Express và frontend React. Ứng dụng cung cấp trải nghiệm đăng bài, bình luận, tương tác, chat real-time, quản lý bạn bè và cài đặt cá nhân.

## ✨ Tính năng chính

### 🔐 Xác thực và tài khoản
- Đăng ký và đăng nhập bằng JWT
- Lưu token trên client và gửi Authorization header tự động
- Xem thông tin cá nhân và cập nhật profile
- Thay đổi mật khẩu

### 📝 Bài viết và tương tác
- Tạo bài viết với nội dung và ảnh
- Upload ảnh lên Cloudinary
- Xem feed bài viết
- Like / reaction bài viết
- Bình luận trực tiếp trên bài viết
- Xóa bài viết của chính mình
- Xem bài viết theo người dùng

### 👥 Kết bạn và tìm kiếm
- Tìm kiếm người dùng theo username
- Gợi ý kết bạn
- Gửi yêu cầu kết bạn
- Chấp nhận / từ chối yêu cầu kết bạn
- Xóa bạn bè
- Xem danh sách bạn bè và yêu cầu kết bạn

### 💬 Chat và hội thoại
- Tạo hội thoại 1-1 hoặc nhóm
- Thêm thành viên, kick thành viên, chuyển quyền admin
- Rời nhóm hoặc xóa nhóm vĩnh viễn
- Gửi tin nhắn trong hội thoại
- Đánh dấu tin nhắn đã đọc
- Lấy số lượng tin nhắn chưa đọc
- Socket.IO hỗ trợ chat real-time và trạng thái online

### 🎨 Giao diện và cài đặt
- React + Ant Design cho UI
- Tailwind CSS cho layout nhanh gọn
- Theme và cài đặt tài khoản
- Navigation giữa các trang: Home, Messages, Notifications, Marketplace, Groups, Friends, Profile, Settings

## 🛠️ Công nghệ sử dụng

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO
- Cloudinary
- bcryptjs
- dotenv
- multer
- cors
- express-async-handler

### Frontend
- React 18
- Vite
- Tailwind CSS
- Ant Design
- Axios
- Socket.IO Client
- React Router DOM

## 📁 Cấu trúc dự án

```
SocialMedia/
├── README.md
├── SPCKBackend/              # Backend Node.js
│   ├── package.json
│   ├── server.js             # Điểm vào server và Socket.IO
│   ├── src/
│   │   ├── config/           # Cấu hình DB, Cloudinary
│   │   ├── controllers/      # Logic API
│   │   ├── middleware/       # Auth, error handling
│   │   ├── models/           # Mongoose schema
│   │   └── routes/           # Route API
└── SPCK/                     # Frontend React
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── eslint.config.js
    └── src/
        ├── App.jsx          # Component chính
        ├── main.jsx         # Điểm vào app React
        ├── contexts/        # AuthContext
        ├── ChucNang/        # Các component chức năng
        ├── Setting/         # Theme và setting UI
        ├── TrangHoatDong/   # Các trang nội bộ
        └── assets/          # Tài nguyên tĩnh
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 16
- MongoDB đang chạy
- npm hoặc yarn

### Backend
```bash
cd SPCKBackend
npm install
```

Tạo file `.env` trong thư mục `SPCKBackend`:
```env
MONGO_URI=mongodb://localhost:27017/SPCKBackend
JWT_SECRET=your_jwt_secret_here
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Chạy backend:
```bash
npm run dev
```

### Frontend
```bash
cd SPCK
npm install
npm run dev
```

Build production:
```bash
npm run build
```

## 📡 API Endpoints chính

### Xác thực
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/profile` - Cập nhật thông tin cá nhân
- `PUT /api/auth/password` - Đổi mật khẩu

### Bài viết
- `POST /api/posts` - Tạo bài viết
- `GET /api/posts` - Lấy feed bài viết
- `GET /api/posts/user/:userId` - Lấy bài viết của người dùng
- `PUT /api/posts/:id/delete` - Xóa bài viết
- `PUT /api/posts/:id/react` - Like / reaction bài viết
- `POST /api/posts/:id/comment` - Bình luận bài viết
- `POST /api/posts/upload` - Upload bài viết kèm ảnh

### Người dùng / bạn bè
- `GET /api/users/me` - Lấy profile hiện tại
- `PUT /api/users/me` - Cập nhật profile hiện tại
- `GET /api/users/search` - Tìm kiếm người dùng
- `GET /api/users/suggestions` - Gợi ý bạn bè
- `PUT /api/users/updatepassword` - Cập nhật mật khẩu
- `PUT /api/users/bio` - Cập nhật tiểu sử
- `PUT /api/users/avatar` - Upload avatar
- `GET /api/users/:id` - Lấy thông tin user khác
- `POST /api/users/:id/friend-request` - Gửi yêu cầu kết bạn
- `PUT /api/users/:id/accept-friend` - Chấp nhận yêu cầu kết bạn
- `PUT /api/users/:id/decline-friend` - Từ chối yêu cầu kết bạn
- `DELETE /api/users/:id/remove-friend` - Xóa bạn bè
- `GET /api/users/:id/friends` - Lấy danh sách bạn bè
- `GET /api/users/:id/friend-requests` - Lấy yêu cầu kết bạn

### Hội thoại
- `GET /api/conversations` - Lấy danh sách hội thoại
- `GET /api/conversations/user/:targetUserId` - Tìm hội thoại với user
- `GET /api/conversations/:conversationId` - Lấy chi tiết hội thoại
- `POST /api/conversations/group` - Tạo nhóm chat
- `PUT /api/conversations/:conversationId/soft-delete` - Xóa tạm hội thoại
- `PUT /api/conversations/:conversationId` - Cập nhật hội thoại
- `POST /api/conversations/:conversationId/add-member` - Thêm thành viên nhóm
- `PUT /api/conversations/:conversationId/kick-member` - Kick thành viên
- `PUT /api/conversations/:conversationId/leave` - Rời nhóm
- `PUT /api/conversations/:conversationId/transfer-admin` - Chuyển quyền admin
- `DELETE /api/conversations/:conversationId/delete-permanently` - Xóa nhóm vĩnh viễn

### Tin nhắn
- `POST /api/messages/:conversationId` - Gửi tin nhắn
- `GET /api/messages/:conversationId` - Lấy tin nhắn trong hội thoại
- `PUT /api/messages/:messageId/read` - Đánh dấu tin nhắn đã đọc
- `GET /api/messages/unread/count` - Lấy số lượng tin nhắn chưa đọc

## 🔒 Bảo mật
- JWT token cho xác thực API
- Mật khẩu hash bằng `bcryptjs`
- Các route bảo vệ (`protect`) chỉ cho phép user đã đăng nhập
- CORS được bật cho frontend

## 📊 Lưu trữ dữ liệu
- MongoDB dùng để lưu user, post, reaction, comment, conversation, message
- Cloudinary dùng upload ảnh avatar và ảnh bài viết
- `multer` xử lý file upload tạm thời trước khi upload lên Cloudinary

## 🤝 Đóng góp
1. Fork repository
2. Tạo branch feature: `git checkout -b feature/my-feature`
3. Commit thay đổi: `git commit -m "Add new feature"`
4. Push nhánh lên remote
5. Tạo Pull Request

## 📝 License
Thêm file `LICENSE` nếu bạn muốn công khai bản quyền.

## 📞 Liên hệ
Nếu cần hỗ trợ hoặc có câu hỏi, mở issue trong repository hoặc liên hệ trực tiếp với người phát triển.

## 📞 Liên hệ
Nếu bạn có câu hỏi hoặc cần hỗ trợ, vui lòng tạo issue trên GitHub hoặc liên hệ với đội ngũ phát triển.

---

**HR Management System** - Quản lý nhân sự hiệu quả với công nghệ hiện đại.
