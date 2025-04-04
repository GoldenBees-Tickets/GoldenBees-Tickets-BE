const { resErrors, resData } = require("../common/common"); // Các hàm xử lý lỗi và dữ liệu trả về (có thể định nghĩa tại đây)
const {
    getAllFoodAndDrinks,
    getFoodAndDrink,
    createFoodAndDrink,
    updateFoodAndDrink,
    deleteFoodAndDrink
} = require("../../service/foodAndDrinkService");
class ApiFoodAndDrinkController {
    static async index(req, res) {
        try {
            const foodAndDrinks = await getAllFoodAndDrinks();
            const message = "Lấy danh sách thực phẩm và đồ uống thành công";
            resData(res, 200, message, foodAndDrinks);
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
            const { name, type, price } = req.body;
            const file = req.file;

            const uploadFileName = file.originalname.split('.')[0]; // Lấy tên file không có đuôi

            const profile_picture = await uploadToCloudinary(file, uploadFolder, uploadFileName);
            const newFoodAndDrink = await createFoodAndDrink({ name, type, price, profile_picture });
            const message = "Tạo mới thực phẩm hoặc đồ uống thành công";
            resData(res, 201, message, newFoodAndDrink);
        } catch (error) {
            console.error("Lỗi khi tạo thực phẩm hoặc đồ uống", error.message);
            resErrors(res, 500, error.message || "Lỗi khi tạo thực phẩm hoặc đồ uống");
        }
    }


    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, type, price } = req.body;

            const file = req.file;

            const uploadFileName = file.originalname.split('.')[0]; // Lấy tên file không có đuôi

            const profile_picture = await uploadToCloudinary(file, uploadFolder, uploadFileName);
            const updatedFoodAndDrink = await updateFoodAndDrink(id, {
                name,
                type,
                price,
                profile_picture
            });
            const message = "Cập nhật thực phẩm hoặc đồ uống thành công";
            resData(res, 200, message, updatedFoodAndDrink);
        } catch (error) {
            console.error("Lỗi khi cập nhật thực phẩm hoặc đồ uống", error.message);
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
