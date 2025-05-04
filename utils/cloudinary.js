const { Readable } = require("stream");
const { v2: cloudinary } = require("cloudinary");
const fs = require('fs');

// Load Cloudinary API keys từ biến môi trường
cloudinary.config({
    cloud_name: process.env.API_CLOUD_NAME,
    api_key: process.env.API_CLOUD_KEY,
    api_secret: process.env.API_SECRET_CLOUD_KEY,
});

/**
 * Upload file lên Cloudinary
 * @param {Object} file - File upload từ Multer
 * @param {string} folder - Thư mục trên Cloudinary
 * @param {string} fileName - Tên file trên Cloudinary
 * @returns {Promise<string>} - URL của ảnh đã upload
 */
const uploadToCloudinary = async (file, folder, fileName) => {        
    try {
        
        // Tạo publicId theo thư mục
        const publicId = `${folder}/${fileName}`;

        let uploadResult;
        
        // Kiểm tra nếu file có buffer (memory storage)
        if (file.buffer) {
            // Tạo buffer stream
            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);

            // Upload lên Cloudinary với đường dẫn thư mục
            uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { public_id: publicId, resource_type: "auto" },
                    (error, result) => (error ? reject(error) : resolve(result))
                );
                bufferStream.pipe(uploadStream);
            });
        } 
        // Kiểm tra nếu file có path (disk storage)
        else if (file.path) {
            uploadResult = await cloudinary.uploader.upload(file.path, {
                public_id: publicId
            });
        }
        // Trường hợp file là một đường dẫn chuỗi trực tiếp
        else if (typeof file === 'string' && fs.existsSync(file)) {
            uploadResult = await cloudinary.uploader.upload(file, {
                public_id: publicId
            });
        }
        else {
            throw new Error("Không thể xác định loại file để upload");
        }
        
        return uploadResult.secure_url; // URL ảnh sau khi upload
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw new Error("Cloudinary upload failed: " + error.message);
    }
};

/**
 * Xóa ảnh trên Cloudinary theo URL
 * @param {string} imageUrl - Đường dẫn ảnh trên Cloudinary
 */
const deleteFromCloudinary = async (imageUrl) => {
    try {
        if (!imageUrl) return;

        // Lấy public_id từ URL (Ví dụ: "folder/ten-file")
        const parts = imageUrl.split("/");
        const filename = parts.pop().split(".")[0]; // Lấy tên file không có đuôi mở rộng
        const folder = parts.slice(-2, -1)[0]; // Lấy thư mục chứa ảnh
        const publicId = `${folder}/${filename}`;

        // Xóa ảnh trên Cloudinary
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary
};
