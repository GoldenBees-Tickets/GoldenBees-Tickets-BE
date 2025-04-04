const {
  getAllUsers,
  getUser,
  updateUser,
  createAdminBranch,
  getAllAdminBranches,
} = require("../../service/userService");
const { uploadToCloudinary } = require("../../utils/cloudinary");
const { resErrors, resData } = require("../common/common");

const uploadFolder = "users";
class ApiUserController {
  static async index(req, res) {
    try {
      const users = await getAllUsers();
      const message = "Get users is successfully";
      res.json({ message, users });
    } catch (error) {
      console.error("Error fetching user data:", error);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async getAdminBranches(req, res) {
    try {
      const admin_branches = await getAllAdminBranches();
      const message = "Get admin branches is successfully";
      res.json({ message, admin_branches });
    } catch (error) {
      console.error("Error fetching admin branches data:", error);
      resErrors(res, 500, error.message || "Internal Server Error");
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
      resErrors(res, 500, error.message || "Internal Server Error");
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
      resErrors(res, 500, error.message || "Internal Server Error");
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
        return resErrors(res, 404, "User not found");
      }

      const file = req?.file || "";
      if (file) {
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

      const user = await updateUser({ id, userData });
      const message = "Get user is successfully";
      res.json({ message, user });
    } catch (error) {
      console.error("Error creating user:", error);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
}
module.exports = ApiUserController;
