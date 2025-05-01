const { Review, User, Movie } = require("../models");
const { Op } = require("sequelize");

const getAllReviews = async ({ page, limit, search, sort_order }) => {
  try {
    // Nếu không có page (được dùng để lấy tất cả review có thể dùng cho chatbot)
    if (!page) {
      const data = await Review.findAll({
        include: [
          { model: User, attributes: ['id', 'name', 'email', 'avatar'] },
          { model: Movie, attributes: ['id', 'name', 'poster'] }
        ]
      });
      return { status: 200, success: true, error: false, data };
    }

    // Tính offset cho phân trang
    const offset = (page - 1) * limit;
    
    // Xây dựng điều kiện tìm kiếm
    let whereClause = {};
    
    // Tìm kiếm theo các trường liên quan
    if (search) {
      whereClause = {
        [Op.or]: [
          { '$User.name$': { [Op.like]: `%${search}%` } },
          { '$Movie.name$': { [Op.like]: `%${search}%` } }
        ]
      };
    }
    
    // Đếm tổng số bản ghi thỏa mãn điều kiện
    const { count } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Movie, attributes: ['id', 'name', 'poster'] }
      ],
      distinct: true
    });
    
    // Lấy danh sách với phân trang và sắp xếp
    const reviews = await Review.findAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Movie, attributes: ['id', 'name', 'poster'] }
      ],
      limit,
      offset,
      order: [
        ['createdAt', sort_order.toUpperCase()]
      ]
    });
    
    // Trả về dữ liệu kèm thông tin phân trang
    return {
      success: true,
      error: false,
      status: 200,
      message: "Get reviews successfully",
      items: reviews,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  } catch (error) {
    console.error("Error fetching list of reviews:", error.message);
    throw error;
  }
};

const getReviewByMovieId = async (movie_id) => {
  try {
    const data = await Review.findAll({
      where: { movie_id },
      include: [
        { model: User }
      ]
    });
    
    // Tính toán rating trung bình
    let totalRating = 0;
    data.forEach(review => {
      totalRating += review.rating;
    });
    const averageRating = data.length > 0 ? totalRating / data.length : 0;
    
    return {
      status: 200, 
      success: true, 
      error: false, 
      data,
      totalRatings: data.length,
      averageRating
    };
  } catch (error) {
    console.error("Error fetching rating:", error.message);
    throw error;
  }
};

const createReview = async ({ user_id, movie_id, rating }) => {  
  try {
    const check = await Review.findOne({ where: { user_id, movie_id } });

    if(check) {
      await Review.update({ rating }, { where: { user_id, movie_id } });
      return {status: 200, success: true, error: false, data: check };
    }

    const data = await Review.create({ user_id, movie_id, rating });
    return {status: 200, success: true, error: false, data, message: "Đánh giá của bạn đã được gửi thành công!"};
  } catch (error) {
    console.error("Error creating rating:", error.message);
    throw error;
  }
};

module.exports = {
  getAllReviews,
  getReviewByMovieId,
  createReview,
};
