const { error } = require("console");
const { Promotion, PromotionUsage } = require("../models");

// Lấy tất cả các chương trình khuyến mãi
const getAllPromotions = async () => {
  try {
    const promotions = await Promotion.findAll();
    return promotions;
  } catch (error) {
    console.error("Error fetching promotions", error.message);
  }
};

// Lấy chương trình khuyến mãi theo id
const getPromotion = async (id) => {
  try {
    const promotion = await Promotion.findOne({ where: { id } });
    return promotion;
  } catch (error) {
    console.error("Error fetching promotion", error.message);
  }
};

// Tạo chương trình khuyến mãi mới
const createPromotion = async ({
  name,
  description,
  start_date,
  end_date,
  discount_type,
  discount_value,
  applicable_to,
  min_order_value,
  max_discount,
  usage_limit,
  per_user_limit,
  code,
}) => {
  try {
    const existingPromotion = await Promotion.findOne({
      where: {
        code,
      },
    });

    if (existingPromotion) {
      return { status: 409, message: "Mã khuyến mãi đã tồn tại" };
    }

    const promotion = await Promotion.create({
      name,
      description,
      start_date,
      end_date,
      discount_type,
      discount_value,
      applicable_to,
      min_order_value,
      max_discount,
      usage_limit,
      per_user_limit,
      code,
    });
    return {status: 201, promotion};
  } catch (error) {
    console.error("Error creating promotion", error.message);
  }
};

const updatePromotion = async ({ id, name, description, end_date }) => {
  try {
    // If no duplicate code is found, proceed with the update
    const promotion = await Promotion.update(
      { name, description, end_date },
      { where: { id } }
    );

    return { status: 200, promotion };
  } catch (error) {
    // Catch any error during the operation
    console.error("Lỗi khi cập nhật khuyến mãi:", error.message);
    throw new Error("Đã xảy ra lỗi khi cập nhật khuyến mãi.");
  }
};

// Xoá chương trình khuyến mãi
const deletePromotion = async (id) => {
  try {
    const promotion = await Promotion.destroy({ where: { id } });
    return promotion;
  } catch (error) {
    console.error("Error deleting promotion", error.message);
  }
};

const checkPromotionCode = async ({code, user_id}) => {
  try {
      const promotion = await Promotion.findOne({ where: { code } });

      if (!promotion) {
          return { error: true, status: 404, message: "Mã khuyến mãi không tồn tại" };
      }

      // Kiểm tra mã hết hạn chưa
      if (new Date() > new Date(promotion.end_date)) {
          return { error: true, status: 400, message: "Mã khuyến mãi đã hết hạn" };
      }

      // Kiểm tra xem mã đã dùng hết số lần chưa
      const usedCount = await PromotionUsage.count({ where: { promotion_id: promotion.id } });
      if (promotion.usage_limit !== null && usedCount >= promotion.usage_limit) {
          return { error: true, status: 400, message: "Mã khuyến mãi đã hết số lần sử dụng" };
      }

      // Kiểm tra người dùng có vượt giới hạn không
      const userUsedCount = await PromotionUsage.count({ where: { promotion_id: promotion.id, user_id } });
      if (promotion.per_user_limit !== null && userUsedCount >= promotion.per_user_limit) {
          return { error: true, status: 400, message: "Bạn đã sử dụng mã này quá số lần cho phép" };
      }

      return { error: false, success: true, status: 200, promotion };
  } catch (error) {
      console.error("Error fetching promotion", error.message);
      return { error: true, status: 500, message: "Lỗi hệ thống" };
  }
};


module.exports = {
  getAllPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  checkPromotionCode,
};
