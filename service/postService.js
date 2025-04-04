const { Post } = require("../models");
const { Op } = require("sequelize");

const getAllPosts = async () => {
  try {
    const posts = await Post.findAll({
      order: [["createdAt", "DESC"]],
    });
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error.message);
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

module.exports = {
  getAllPosts,
  getPost,
  searchPosts,
  createPost,
  updatePost,
  deletePost,
}; 