const { Combo, ComboItem, FoodAndDrink, sequelize } = require('../models'); // Import model Combo
const { Op } = require('sequelize');

// Service để lấy tất cả các combo với phân trang, tìm kiếm và sắp xếp
const getAllCombos = async (options = {}) => {
    try {
        const { page = 1, limit = 10, search = '', sort_order = 'desc' } = options;
        
        // Tính offset cho phân trang
        const offset = (page - 1) * limit;
        
        // Xây dựng điều kiện tìm kiếm
        let whereClause = {};
        
        // Tìm kiếm theo tên combo
        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }
        
        // Đếm tổng số bản ghi thỏa mãn điều kiện
        const { count } = await Combo.findAndCountAll({
            where: whereClause,
            distinct: true
        });
        
        // Lấy danh sách với phân trang và sắp xếp
        const combos = await Combo.findAll({
            where: whereClause,
            include: [
              {
                model: ComboItem,
                include: [
                  {
                    model: FoodAndDrink
                  }
                ]
              }
            ],
            limit,
            offset,
            order: [
                ['name', sort_order.toUpperCase()]
            ]
        });
        
        // Trả về dữ liệu kèm thông tin phân trang
        return {
            items: combos,
            pagination: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(error.message || "Lỗi khi lấy danh sách combo");
    }
};

// Service để lấy thông tin combo theo ID
const getCombo = async (id) => {
    try {
        const combo = await Combo.findOne({
            where: { id }
        });
        if (!combo) {
            throw new Error("Không tìm thấy combo");
        }
        return combo;
    } catch (error) {
        throw new Error(error.message || "Lỗi khi lấy thông tin combo");
    }
};

const createCombo = async ({ name, price, profile_picture, items }) => {
    const transaction = await sequelize.transaction();

    try {
        const newCombo = await Combo.create({ name, price, profile_picture }, { transaction });

        const comboItemsData = items.map(({ foodAndDrinkId, quantity }) => ({
            combo_id: newCombo.id,
            product_id: foodAndDrinkId,
            quantity,
        }));

        await ComboItem.bulkCreate(comboItemsData, { transaction });

        await transaction.commit(); 
        return newCombo;
    } catch (error) {
        await transaction.rollback(); 
        console.error("Lỗi khi tạo combo:", error.message);
        throw new Error(error.message || "Lỗi khi tạo mới combo");
    }
};

// Service để cập nhật thông tin combo
const updateCombo = async (id, { name, price, profile_picture, ComboItems }) => {
    const transaction = await sequelize.transaction();
    try {        
        // Kiểm tra xem combo có tồn tại không
        const existingCombo = await Combo.findByPk(id, { transaction });
        if (!existingCombo) {
            throw new Error("Combo không tồn tại");
        }

        // Cập nhật thông tin combo
        const updateData = { name, price };
        if (profile_picture) {
            updateData.profile_picture = profile_picture;
        }

        await Combo.update(updateData, { where: { id }, transaction });

        // Xóa các combo items cũ trước khi cập nhật mới
        await ComboItem.destroy({ where: { combo_id: id }, transaction });

        // Thêm combo items mới
        if (ComboItems && ComboItems.length > 0) {
            const comboItemsData = ComboItems.map((item) => {
                // Kiểm tra và sử dụng đúng key - có thể là foodAndDrinkId hoặc product_id
                const product_id = item.foodAndDrinkId || item.product_id;
                return {
                    combo_id: id,
                    product_id: product_id,
                    quantity: item.quantity,
                };
            });            
            await ComboItem.bulkCreate(comboItemsData, { transaction });
        }

        // Commit transaction nếu mọi thứ đều thành công
        await transaction.commit();

        // Lấy lại thông tin combo đã cập nhật
        const updatedCombo = await Combo.findOne({ 
            where: { id }, 
            include: [{
                model: ComboItem,
                include: [{
                    model: FoodAndDrink
                }]
            }]
        });
        return updatedCombo;
    } catch (error) {
        // Rollback nếu có lỗi
        await transaction.rollback();
        console.error("Lỗi khi cập nhật combo:", error);
        throw new Error(error.message || "Lỗi khi cập nhật combo");
    }
};

// Service để xóa combo (xóa mềm)
const deleteCombo = async (id) => {
    const transaction = await sequelize.transaction();
    try {

        await ComboItem.destroy({ where: { combo_id: id } });

        await Combo.destroy({ where: { id } });

        await transaction.commit();
        return {success: true, message: "Xóa combo thành công", error: null};
    } catch (error) {
        throw new Error(error.message || "Lỗi khi xóa combo");
    }
};

const getAllCombosForBoxchat = async () => {
    try {
        return await Combo.findAll({
            include: [
              {
                model: ComboItem,
                include: [
                  {
                    model: FoodAndDrink
                  }
                ]
              }
            ]
          });
    } catch (error) {
        throw new Error(error.message || "Lỗi khi lấy danh sách combo");
    }
};

module.exports = {
    getAllCombos,
    getCombo,
    createCombo,
    updateCombo,
    deleteCombo,
    getAllCombosForBoxchat
};
