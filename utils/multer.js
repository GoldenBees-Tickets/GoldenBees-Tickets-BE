const multer = require('multer');
const path = require('path');

// Cấu hình lưu vào bộ nhớ
const memoryStorage = multer.memoryStorage();

// Tạo bộ lọc file
const fileFilter = (req, file, cb) => {
    // Chấp nhận các loại file ảnh
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
    }
};

// Cấu hình multer
const multerConfig = {
    storage: memoryStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB - giới hạn kích thước file
    }
};

const upload = {
    single: (name) => multer(multerConfig).single(name),
    multiple: (name, maxCount = 10) => multer(multerConfig).array(name, maxCount),
    any: multer(multerConfig).any()
};

module.exports = upload;
