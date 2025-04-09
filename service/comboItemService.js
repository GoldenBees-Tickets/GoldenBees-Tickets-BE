const { ComboItem } = require('../models');

const getAllComboItems = async () => {
    try {
        return await ComboItem.findAll();
    } catch (error) {
        throw new Error(error.message || "Lỗi khi lấy danh sách combo item");
    }
};
const getComboItem = async (id) => {
    try {
        const comboItem = await ComboItem.findOne({
            where: { id }
        });
        if (!comboItem) {
            throw new Error("Không tìm thấy combo item");
        }
        return comboItem;
    } catch (error) {
        throw new Error(error.message || "Lỗi khi lấy thông tin combo item");
    }
};
const createComboItem = async ({ combo_id, product_id, quantity }) => {
    try {
        if (!combo_id || !product_id || !quantity) {
            throw new Error("Missing required fields: combo_id, product_id, or quantity");
        }

        // Giả sử comboItems là mảng các đối tượng ComboItem đã có
        let comboItems = await ComboItem.findAll({ where: { combo_id } });

        // Tìm đối tượng ComboItem có product_id trùng khớp
        let existingComboItem = comboItems.find(item => item.product_id === product_id);

        if (existingComboItem) {
            // Nếu có, cộng quantity vào item cũ
            existingComboItem.quantity += quantity;
            await existingComboItem.save();
            return existingComboItem;
        } else {
            // Nếu không có, tạo đối tượng mới
            const newComboItem = await ComboItem.create({ combo_id, product_id, quantity });
            return newComboItem;
        }
    } catch (error) {
        console.error("Error while creating combo item:", error.message);
        throw new Error(error.message || "Lỗi khi tạo mới combo item");
    }
};


const updateComboItem = async (combo_id, data) => {
    try {
      const updatedComboItems = [];
      const newComboItems = [];
  
      // Xoá tất cả combo_items cũ của combo_id trước khi cập nhật lại
      await ComboItem.destroy({
        where: { combo_id },
      });
  
      // Duyệt qua từng item trong dữ liệu
      for (let item of data) {
        const { product_id, quantity } = item;
  
        // Kiểm tra combo_item có tồn tại với combo_id và product_id không
        const existingComboItem = await ComboItem.findOne({
          where: { combo_id, product_id },
        });
  
        if (existingComboItem) {
          // Nếu sản phẩm đã tồn tại, cập nhật số lượng (quantity)
          existingComboItem.quantity = quantity;
          await existingComboItem.save(); // Lưu lại thay đổi
          updatedComboItems.push(existingComboItem);
        } else {
          // Nếu sản phẩm chưa tồn tại, thêm vào danh sách để tạo mới sau
          newComboItems.push({ combo_id, product_id, quantity });
        }
      }
  
      // Nếu có combo_items mới, tạo tất cả cùng lúc
      if (newComboItems.length > 0) {
        const createdItems = await ComboItem.bulkCreate(newComboItems);
        updatedComboItems.push(...createdItems);
      }
  
      // Trả về danh sách combo_items đã được cập nhật hoặc tạo mới
      return updatedComboItems;
  
    } catch (error) {
      // Lỗi xử lý
      console.error("Error updating combo items: ", error);
      throw new Error(error.message || "Lỗi khi cập nhật combo item");
    }
  };

const deleteComboItem = async (combo_id) => {
    try {
        const comboItem = await ComboItem.destroy({ where: { combo_id } });

        if (!comboItem) {
            throw new Error("Không tìm thấy combo item để xóa");
        }
        return comboItem;
    } catch (error) {        
        throw new Error(error.message || "Lỗi khi xóa combo item");
    }
};


module.exports = {
    getAllComboItems,
    getComboItem,
    createComboItem,
    updateComboItem,
    deleteComboItem
};
