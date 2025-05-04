const {
  getAllUsers,
  getUser,
  updateUser,
  createAdminBranch,
  getAllAdminBranches,
  getStarUser,
  updateStatusForAdmin,
  updateDataAdmin,
} = require("../../service/userService");
const { uploadToCloudinary } = require("../../utils/cloudinary");
const { resErrors, resData } = require("../common/common");

const uploadFolder = "users";
class ApiUserController {
  static async index(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const result = await getAllUsers(parseInt(page), parseInt(limit), search);
      const message = "Get users is successfully";
      res.json({ message, ...result });
    } catch (error) {
      console.error("Error fetching user data:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async getAdminBranches(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const result = await getAllAdminBranches(parseInt(page), parseInt(limit), search);
      const message = "Get admin branches is successfully";
      res.json({ message, ...result });
    } catch (error) {
      console.error("Error fetching admin branches data:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async create(req, res) {
    try {
      const {
        username,
        email,
        password,
        role = "branch_admin",
        branch_id,
      } = req.body;
      const user = await createAdminBranch({
        username,
        email,
        password,
        role,
        branch_id,
      });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user data:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async show(req, res) {
    try {
      const { id } = req.params;
      const user = await getUser(id);

      const message = "Get user is successfully";
      res.json({ message, user });
    } catch (error) {
      console.error("Error creating user:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { ...otherData } = req.body;
      // const filePath = req.file ? req.file.path : '';
      const checkUser = await getUser(id);
      let userData = {};

      if (!checkUser) {
        return {status: 404, message: "Không tìm thấy người dùng", error: true, success: false};
      }

      const file = req?.file;
      
      if (file !== undefined) {
        const uploadFileName = file.originalname.split(".")[0];
        
        const image = await uploadToCloudinary(
          file,
          uploadFolder,
          uploadFileName
        );
        userData = {
          ...otherData,
          image,
        };
      } else {
        userData = {
          ...otherData,
        };
      }

      const data = await updateUser({ id, userData });
      res.json(data);
    } catch (error) {
      console.error("Error creating user:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async getStarUserController (req, res) {
    try {
      const { id } = req.params;
      const data = await getStarUser(id);
      res.json(data);
    } catch (error) {
      console.error("Error creating user:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async updateStatusUser (req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await updateStatusForAdmin({ id, status });
      res.json(data);
    } catch (error) {
      console.error("Error updating user:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async updateAdminController (req, res) {
    try {
      const { id } = req.params;
      const { ...otherData } = req.body;
      const data = await updateDataAdmin({ id, userData: otherData });
      res.json(data);
    } catch (error) {
      console.error("Error updating user:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }
}
module.exports = ApiUserController;
