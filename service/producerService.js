const { Producer } = require("../models");
const { Op } = require('sequelize');

// Lấy tất cả producer
const getAllProducers = async (options = {}) => {
  try {
    const { page = 1, limit = 5, search = '', sort_order = 'desc' } = options;
    
    // Tính toán offset cho phân trang
    const offset = (page - 1) * limit;
    
    // Xây dựng điều kiện tìm kiếm
    let whereClause = {};
    
    // Tìm kiếm theo tên nhà sản xuất
    if (search) {
      whereClause.name = {
        [Op.like]: `%${search}%`
      };
    }
    
    // Đếm tổng số nhà sản xuất thỏa mãn điều kiện
    const { count } = await Producer.findAndCountAll({
      where: whereClause,
      distinct: true
    });
    
    // Lấy dữ liệu nhà sản xuất với phân trang và sắp xếp
    const producers = await Producer.findAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [
        ['name', sort_order.toUpperCase()]
      ]
    });
    
    // Tính toán thông tin phân trang
    const totalPages = Math.ceil(count / limit);
    
    return {
      producers,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit
      }
    };
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

const getAllProducersForBoxchat = async () => {
  try {
    return await Producer.findAll();
  } catch (error) {
    console.error("Error fetching producers:", error.message);
    throw error;
  }
};

const getProducersNotPage = async () => {
  try {
    const data = await Producer.findAll();
    return { status: 200, success: true, message: "Get all producers successfully", data, error: false };
  } catch (error) {
    console.error("Error fetching all producers:", error.message);
    throw error;
  }
}

module.exports = {
  getAllProducers,
  getProducer,
  createProducer,
  updateProducer,
  deleteProducer,
  getAllProducersForBoxchat,
  getProducersNotPage
};

