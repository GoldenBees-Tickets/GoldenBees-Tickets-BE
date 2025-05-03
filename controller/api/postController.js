const { resErrors, resData } = require("../common/common");
const {
  getAllPosts,
  getPost,
  searchPosts,
  createPost,
  updatePost,
  deletePost,
  getPostNotPage,
} = require("../../service/postService");
const { uploadToCloudinary, deleteFromCloudinary } = require("../../utils/cloudinary");

const uploadFolder = "posts";

class ApiPostController {
  static async index(req, res) {
    try {
      // Lấy các tham số phân trang, tìm kiếm và sắp xếp từ request
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const sort_order = req.query.sort_order || 'desc';
      
      // Gọi service với các tham số
      const result = await getAllPosts({ page, limit, search, sort_order });
      
      // Trả về dữ liệu với thông tin phân trang
      res.json({
        message: "Get all posts successfully",
        posts: result.posts,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Error fetching posts:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async show(req, res) {
    try {
      const { id } = req.params;
      const post = await getPost(id);
      
      if (!post) {
        return resErrors(res, 404, "Post not found");
      }
      
      res.json({ message: "Get post successfully", post });
    } catch (error) {
      console.error("Error fetching post:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async search(req, res) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return resErrors(res, 400, "Search query is required");
      }
      
      const posts = await searchPosts(query);
      res.json({ message: "Search posts successfully", posts });
    } catch (error) {
      console.error("Error searching posts:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async create(req, res) {
    try {
      const { title, content, status, author } = req.body;
      
      if (!title || !content) {
        return resErrors(res, 400, "Title and content are required");
      }
      
      let thumbnailUrl = null;
      
      // Handle file upload if exists
      if (req.file) {
        const result = await uploadToCloudinary(req.file.path, uploadFolder);
        thumbnailUrl = result.secure_url;
      }
      
      const postData = {
        title,
        content,
        status: status || 'active',
        author: author || 'Admin',
        thumbnail: thumbnailUrl
      };
      
      const post = await createPost(postData);
      res.json({ message: "Post created successfully", post });
    } catch (error) {
      console.error("Error creating post:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { title, content, status, author } = req.body;
      
      const post = await getPost(id);
      
      if (!post) {
        return resErrors(res, 404, "Post not found");
      }
      
      let thumbnailUrl = post.thumbnail;
      
      // Handle file upload if exists
      if (req.file) {
        // Delete old thumbnail if exists
        if (post.thumbnail) {
          try {
            const publicId = post.thumbnail.split('/').pop().split('.')[0];
            await deleteFromCloudinary(`${uploadFolder}/${publicId}`);
          } catch (err) {
            console.error("Error deleting old thumbnail:", err);
          }
        }
        
        const result = await uploadToCloudinary(req.file.path, uploadFolder);
        thumbnailUrl = result.secure_url;
      }
      
      const postData = {
        title: title || post.title,
        content: content || post.content,
        status: status || post.status,
        author: author || post.author,
        thumbnail: thumbnailUrl
      };
      
      const updatedPost = await updatePost(id, postData);
      res.json({ message: "Post updated successfully", post: updatedPost });
    } catch (error) {
      console.error("Error updating post:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async destroy(req, res) {
    try {
      const { id } = req.params;
      
      const post = await getPost(id);
      
      if (!post) {
        return resErrors(res, 404, "Post not found");
      }
      
      // Delete thumbnail if exists
      if (post.thumbnail) {
        try {
          const publicId = post.thumbnail.split('/').pop().split('.')[0];
          await deleteFromCloudinary(`${uploadFolder}/${publicId}`);
        } catch (err) {
          console.error("Error deleting thumbnail:", err);
        }
      }
      
      await deletePost(id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async getPostNotPageController(req, res) {
    try {
      const data = await getPostNotPage();
      res.json(data);
    } catch (error) {
      console.error("Error fetching posts:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
}

module.exports = ApiPostController; 