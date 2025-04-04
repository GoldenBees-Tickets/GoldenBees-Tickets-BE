const { resErrors, resData } = require("../common/common");
const {
  getAllCombos,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo,
} = require("../../service/comboService");
const {
  createComboItem,
  deleteComboItem,
  updateComboItem,
  
} = require("../../service/comboItemService");
const { uploadToCloudinary } = require("../../utils/cloudinary");

const uploadFolder = "combos";

class ApiComboController {
  static async index(req, res) {
    try {
      const combos = await getAllCombos();
      const message = "Lấy danh sách combo thành công";
      resData(res, 200, message, combos);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách combo", error.message);
      resErrors(res, 500, error.message || "Lỗi khi lấy danh sách combo");
    }
  }

  static async show(req, res) {
    try {
      const { id } = req.params;
      const combo = await getCombo(id);
      if (combo) {
        const message = "Lấy thông tin combo thành công";
        resData(res, 200, message, combo);
      } else {
        resErrors(res, 404, "Không tìm thấy combo");
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin combo", error.message);
      resErrors(res, 500, error.message || "Lỗi khi lấy thông tin combo");
    }
  }

  static async create(req, res) {
    try {
        const { name, price, items } = req.body;
        const file = req.file;
        
        const uploadFileName = file.originalname.split(".")[0];

        // Upload ảnh lên Cloudinary
        const url = await uploadToCloudinary(file, uploadFolder, uploadFileName);
        
        // Gọi service để tạo combo và xử lý transaction
        const newCombo = await createCombo({ name, price, profile_picture: url, items });

        resData(res, 201, "Tạo combo thành công!", newCombo);
    } catch (error) {
        console.error("Error while creating combo:", error.message);
        resErrors(res, 500, error.message || "Lỗi khi tạo combo");
    }
}

 static async update(req, res) {
  try {
    const { id } = req.params;
    const { name, price, ComboItems } = req.body;

    const file = req.file;

    const uploadFileName = file.originalname.split(".")[0];

    // Upload ảnh lên Cloudinary
    const url = await uploadToCloudinary(file, uploadFolder, uploadFileName);

    // Gọi service để cập nhật combo
    const updatedCombo = await updateCombo(id, { name, price, profile_picture: url, ComboItems });

    res.status(200).json({
      message: "Cập nhật combo thành công",
      updatedCombo,
    });
  } catch (error) {
    // Log lỗi và gửi phản hồi lỗi về client
    console.error("Lỗi khi cập nhật combo", error.message);
    resErrors(res, 500, error.message || "Lỗi khi cập nhật combo");
  }
}


  static async delete(req, res) {
    try {
      const { id } = req.params;

      await deleteCombo(id);

      let combo_id = id;
      await deleteComboItem(combo_id);

      const message = "Xóa combo và combo items thành công";
      resData(res, 200, message);
    } catch (error) {
      console.error("Lỗi khi xóa combo hoặc combo items", error.message);
      resErrors(
        res,
        500,
        error.message || "Lỗi khi xóa combo hoặc combo items"
      );
    }
  }
}

module.exports = ApiComboController;
