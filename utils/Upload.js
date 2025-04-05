// Đảm bảo sử dụng require thay vì ES modules
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Đảm bảo thư mục uploads tồn tại
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    // Loại bỏ các ký tự đặc biệt và khoảng trắng trong tên file
    const originalname = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueFilename = `${Date.now()}_${uuidv4()}${path.extname(originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Lọc loại file
const fileFilter = (req, file, cb) => {
  // Chấp nhận hình ảnh
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  }
};

// Xử lý lỗi multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Kích thước file vượt quá giới hạn (tối đa 5MB)' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: `Lỗi upload: ${err.message}` 
    });
  }
  next(err);
};

// Khởi tạo middleware upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Export module
module.exports = upload;
