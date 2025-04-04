const { FoodAndDrink } = require('../models'); // Giả sử bạn có một thư mục `models` với model `FoodAndDrink`

// Service để lấy tất cả thực phẩm và đồ uống
const getAllFoodAndDrinks = async () => {
    try {
        return await FoodAndDrink.findAll();

    } catch (error) {
        throw new Error(error.message || "Lỗi khi lấy danh sách thực phẩm và đồ uống");
    }
};
// Service để lấy thông tin thực phẩm hoặc đồ uống theo ID
const getFoodAndDrink = async (id) => {
    try {
        const foodAndDrink = await FoodAndDrink.findOne({
            where: { id }
        });
        if (!foodAndDrink) {
            throw new Error("Không tìm thấy thực phẩm hoặc đồ uống");
        }
        return foodAndDrink;
    } catch (error) {
        throw new Error(error.message || "Lỗi khi lấy thông tin thực phẩm hoặc đồ uống");
    }
};

// Service để tạo mới một thực phẩm hoặc đồ uống
const createFoodAndDrink = async ({ name, type, price, profile_picture }) => {

    try {
        return await FoodAndDrink.create({ name, type, price, profile_picture })
    } catch (error) {
        console.error("lỗi tao mới:")
        throw error
    }

}

// Service để cập nhật thông tin thực phẩm hoặc đồ uống
const updateFoodAndDrink = async (id, data) => {
    try {
        const { name, type, price, profile_picture } = data;
        const updateData = { name, type, price };

        if (profile_picture) {
            updateData.profile_picture = profile_picture;  // Cập nhật hình ảnh nếu có
        }

        const [updatedRows] = await FoodAndDrink.update(updateData, { where: { id } });

        if (updatedRows === 0) {
            throw new Error("Không tìm thấy thực phẩm hoặc đồ uống để cập nhật");
        }
        // Lấy lại thông tin của thực phẩm hoặc đồ uống đã được cập nhật
        const updatedFoodAndDrink = await FoodAndDrink.findOne({
            where: { id }
        });
        return updatedFoodAndDrink;
    } catch (error) {
        throw new Error(error.message || "Lỗi khi cập nhật thực phẩm hoặc đồ uống");
    }
};

// Service để xóa thực phẩm hoặc đồ uống (xóa mềm)
const deleteFoodAndDrink = async (id) => {
    try {
        const foodAndDrink = await FoodAndDrink.destroy({ where: { id } });

        if (!foodAndDrink) {
            throw new Error("Không tìm thấy thực phẩm hoặc đồ uống để xóa");
        }
        return foodAndDrink;
    } catch (error) {
        throw new Error(error.message || "Lỗi khi xóa thực phẩm hoặc đồ uống");
    }
};

module.exports = {
    getAllFoodAndDrinks,
    getFoodAndDrink,
    createFoodAndDrink,
    updateFoodAndDrink,
    deleteFoodAndDrink
};
