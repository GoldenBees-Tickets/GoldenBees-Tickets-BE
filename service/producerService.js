const { Producer } = require("../models");

// Lấy tất cả producer
const getAllProducers = async () => {
  try {
    return await Producer.findAll();
  } catch (error) {
    console.error("Error fetching producers:", error.message);
    throw error;
  }
};

// Lấy producer theo ID
const getProducer = async (id) => {
  try {
    return await Producer.findOne({ where: { id } });
  } catch (error) {
    console.error("Error fetching producer:", error.message);
    throw error;
  }
};

// Tạo producer mới
const createProducer = async ({ name, bio, profile_picture }) => {
  try {
    const data = await Producer.create({ name, bio, profile_picture });
    return {data, status: 200, message: "Tạo nhà sản xuất thành công"};
  } catch (error) {
    console.error("Error creating producer:", error.message);
    throw error;
  }
};

// Cập nhật thông tin producer
const updateProducer = async ({ id, name, bio, profile_picture }) => {
  try {    
    // Kiểm tra xem có tồn tại Producer không
    const existingProducer = await Producer.findByPk(id);
    if (!existingProducer) {
      return { status: 404, message: "Producer không tồn tại" };
    }

    const updateData = { name, bio };
    if (profile_picture) { // Chỉ thêm nếu có ảnh mới
      updateData.profile_picture = profile_picture;
    }

    const [updatedCount] = await Producer.update(updateData, { where: { id } });

    if (updatedCount === 0) {
      return { status: 400, message: "Không có dữ liệu nào được thay đổi" };
    }

    return { status: 200, message: "Cập nhật nhà sản xuất thành công" };
  } catch (error) {
    console.error("Error updating producer:", error.message);
    throw error;
  }
};



// Xoá producer
const deleteProducer = async (id) => {
  try {
     await Producer.destroy({ where: { id } });
    return { status: 200, message: "Xóa nhà sản xuất thành công" };
  } catch (error) {
    console.error("Error deleting producer:", error.message);
    throw error;
  }
};

module.exports = {
  getAllProducers,
  getProducer,
  createProducer,
  updateProducer,
  deleteProducer,
};
