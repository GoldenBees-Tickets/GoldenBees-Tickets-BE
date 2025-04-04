const multer = require('multer');

const storage = multer.memoryStorage();

const upload = {
    single: (name) => multer({ storage }).single(name), // Upload 1 file duy nhất với name động
    multiple: (name, maxCount = 10) => multer({ storage }).array(name, maxCount), // Upload nhiều file
    any: multer({ storage }).any() // Upload tất cả file không cần name cố định
};

module.exports = upload;
