const { resErrors, resData } = require("../common/common"); // Các hàm xử lý lỗi và dữ liệu trả về (có thể định nghĩa tại đây)
const {
    getAllFoodAndDrinks,
    getFoodAndDrink,
    createFoodAndDrink,
    updateFoodAndDrink,
    deleteFoodAndDrink
} = require("../../service/foodAndDrinkService");
const { uploadToCloudinary } = require("../../utils/cloudinary");

// Định nghĩa thư mục lưu trữ trên Cloudinary
const uploadFolder = "food_and_drinks";

class ApiFoodAndDrinkController {
    static async index(req, res) {
        try {
            // Lấy các tham số phân trang, tìm kiếm và sắp xếp từ request
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const sort_order = req.query.sort_order || 'desc';
            const type = req.query.type || '';
            
            // Gọi service với các tham số
            const result = await getAllFoodAndDrinks({ page, limit, search, sort_order, type });
            
            // Trả về dữ liệu với thông tin phân trang
            res.json({
                message: "Lấy danh sách thực phẩm và đồ uống thành công",
                items: result.items,
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Lỗi khi lấy danh sách thực phẩm và đồ uống", error.message);
            resErrors(res, 500, error.message || "Lỗi khi lấy danh sách thực phẩm và đồ uống");
        }
    }
    static async show(req, res) {
        try {
            const { id } = req.params;
            const foodAndDrink = await getFoodAndDrink(id);
            if (foodAndDrink) {
                const message = "Lấy thông tin thực phẩm hoặc đồ uống thành công";
                resData(res, 200, message, foodAndDrink);
            } else {
                resErrors(res, 404, "Không tìm thấy thực phẩm hoặc đồ uống");
            }
        } catch (error) {
            console.error("Lỗi khi lấy thông tin thực phẩm hoặc đồ uống", error.message);
            resErrors(res, 500, error.message || "Lỗi khi lấy thông tin thực phẩm hoặc đồ uống");
        }
    }

    static async create(req, res) {
        try {         
            // Đảm bảo body không rỗng
            if (!req.body || Object.keys(req.body).length === 0) {
                return resErrors(res, 400, "Không nhận được dữ liệu. Vui lòng kiểm tra form data.");
            }
            
            const { name, type, price } = req.body;
            
            // Kiểm tra các trường bắt buộc
            if (!name || !type) {
                return resErrors(res, 400, "Tên và loại món ăn là bắt buộc.");
            }
            
            const file = req.file;
            let profile_picture = null;

            if (file) {
                try {
                    const uploadFileName = `food_drink_${Date.now()}_${file.originalname.split('.')[0]}`; // Tạo tên file động
                    profile_picture = await uploadToCloudinary(file, uploadFolder, uploadFileName);
                } catch (cloudinaryError) {
                    console.error("CLOUDINARY ERROR:", cloudinaryError);
                    // Tiếp tục thực hiện tạo mới mà không có hình ảnh
                    profile_picture = null;
                }
            }

            const newFoodAndDrink = await createFoodAndDrink({ name, type, price, profile_picture });
            const message = "Tạo mới thực phẩm hoặc đồ uống thành công";
            resData(res, 201, message, newFoodAndDrink);
        } catch (error) {
            console.error("Lỗi khi tạo thực phẩm hoặc đồ uống", error);
            console.error("ERROR STACK:", error.stack);
            resErrors(res, 500, error.message || "Lỗi khi tạo thực phẩm hoặc đồ uống");
        }
    }


    static async update(req, res) {
        try {         
            const { id } = req.params;
            const { name, type, price, profile_picture } = req.body;
            
            // Kiểm tra các trường bắt buộc
            if (!name || !type) {
                return resErrors(res, 400, "Tên và loại món ăn là bắt buộc.");
            }

            const file = req.file;
            let updatedProfilePicture = undefined; // Để undefined nếu không có file, giữ nguyên giá trị cũ

            // Nếu có file mới, upload lên Cloudinary
            if (file) {
                try {              
                    const uploadFileName = `food_drink_${Date.now()}_${file.originalname.split('.')[0]}`; // Tạo tên file động
                    updatedProfilePicture = await uploadToCloudinary(file, uploadFolder, uploadFileName);
                } catch (cloudinaryError) {
                    console.error("UPDATE CLOUDINARY ERROR:", cloudinaryError);
                    // Tiếp tục thực hiện cập nhật mà không thay đổi hình ảnh
                    updatedProfilePicture = undefined;
                }
            } 
            // Nếu người dùng gửi "null" để xóa ảnh
            else if (profile_picture === "null") {
                updatedProfilePicture = null; // Đặt giá trị null để xóa ảnh
            }

            // Chỉ cập nhật hình ảnh nếu có file mới hoặc xóa ảnh
            const updateData = { name, type, price };
            if (updatedProfilePicture !== undefined) {
                updateData.profile_picture = updatedProfilePicture;
            }

            const updatedFoodAndDrink = await updateFoodAndDrink(id, updateData);
            const message = "Cập nhật thực phẩm hoặc đồ uống thành công";
            resData(res, 200, message, updatedFoodAndDrink);
        } catch (error) {
            console.error("Lỗi khi cập nhật thực phẩm hoặc đồ uống", error);
            console.error("UPDATE ERROR STACK:", error.stack);
            resErrors(res, 500, error.message || "Lỗi khi cập nhật thực phẩm hoặc đồ uống");
        }
    }


    static async delete(req, res) {
        try {
            const { id } = req.params;
            await deleteFoodAndDrink(id);
            const message = "Xóa thực phẩm hoặc đồ uống thành công";
            resData(res, 200, message);
        } catch (error) {
            console.error("Lỗi khi xóa thực phẩm hoặc đồ uống", error.message);
            resErrors(res, 500, error.message || "Lỗi khi xóa thực phẩm hoặc đồ uống");
        }
    }
}
module.exports = ApiFoodAndDrinkController;
