const { Post } = require("../models");
const { Op } = require("sequelize");

const getAllPosts = async (options = {}) => {
  try {
    const { page = 1, limit = 10, search = "", sort_order = "desc" } = options;

    // Tính offset cho phân trang
    const offset = (page - 1) * limit;

    // Xây dựng điều kiện tìm kiếm
    let whereClause = {};

    // Tìm kiếm theo tiêu đề
    if (search) {
      whereClause.title = {
        [Op.like]: `%${search}%`,
      };
    }

    // Đếm tổng số bài viết thỏa mãn điều kiện
    const { count } = await Post.findAndCountAll({
      where: whereClause,
      distinct: true,
    });

    // Lấy danh sách bài viết với phân trang và sắp xếp
    const posts = await Post.findAll({
      where: whereClause,
      limit,
      offset,
      order: [["title", sort_order.toUpperCase()]],
    });

    // Trả về dữ liệu kèm thông tin phân trang
    return {
      posts,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
      },
    };
  } catch (error) {
    console.error("Error fetching list of posts:", error.message);
    throw error;
  }
};

const getPost = async (id) => {
  try {
    const post = await Post.findByPk(id);
    return post;
  } catch (error) {
    console.error("Error fetching post:", error.message);
    throw error;
  }
};

const searchPosts = async (query) => {
  try {
    const posts = await Post.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${query}%` } },
          { content: { [Op.like]: `%${query}%` } },
        ],
      },
      order: [["createdAt", "DESC"]],
    });
    return posts;
  } catch (error) {
    console.error("Error searching posts:", error.message);
    throw error;
  }
};

const createPost = async (postData) => {
  try {
    const post = await Post.create(postData);
    return post;
  } catch (error) {
    console.error("Error creating post:", error.message);
    throw error;
  }
};

const updatePost = async (id, postData) => {
  try {
    const post = await Post.findByPk(id);
    if (!post) {
      throw new Error("Post not found");
    }
    
    await post.update(postData);
    return post;
  } catch (error) {
    console.error("Error updating post:", error.message);
    throw error;
  }
};

const deletePost = async (id) => {
  try {
    const post = await Post.findByPk(id);
    if (!post) {
      throw new Error("Post not found");
    }
    
    await post.destroy();
    return { success: true, message: "Post deleted successfully" };
  } catch (error) {
    console.error("Error deleting post:", error.message);
    throw error;
  }
};

const getPostNotPage = async () => {
  try {
    const data = await Post.findAll();
    return {
      status: 200,
      message: "Get all posts successfully",
      data: data,
      success: true,
      error: false,
    };
  } catch (error) {
    console.error("Error fetching post:", error.message);
    throw error;
  }
};

module.exports = {
  getAllPosts,
  getPost,
  searchPosts,
  createPost,
  updatePost,
  deletePost,
  getPostNotPage
}; 