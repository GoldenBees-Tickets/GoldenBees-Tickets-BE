const { Combo, ComboItem, FoodAndDrink, sequelize } = require('../models'); // Import model Combo

// Service để lấy tất cả các combo
const getAllCombos = async () => {
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
            const comboItemsData = ComboItems.map(({ product_id, quantity }) => ({
                combo_id: id,
                product_id,
                quantity,
            }));
            await ComboItem.bulkCreate(comboItemsData, { transaction });
        }

        // Commit transaction nếu mọi thứ đều thành công
        await transaction.commit();

        // Lấy lại thông tin combo đã cập nhật
        const updatedCombo = await Combo.findOne({ where: { id }, include: ComboItem });
        return updatedCombo;
    } catch (error) {
        // Rollback nếu có lỗi
        await transaction.rollback();
        console.error("Lỗi khi cập nhật combo:", error.message);
        throw new Error(error.message || "Lỗi khi cập nhật combo");
    }
};

// Service để xóa combo (xóa mềm)
const deleteCombo = async (id) => {
    try {
        const combo = await Combo.destroy({ where: { id } });

        if (!combo) {
            throw new Error("Không tìm thấy combo để xóa");
        }
        return combo;
    } catch (error) {
        throw new Error(error.message || "Lỗi khi xóa combo");
    }
};

module.exports = {
    getAllCombos,
    getCombo,
    createCombo,
    updateCombo,
    deleteCombo
};
