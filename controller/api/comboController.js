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
      // Lấy các tham số phân trang, tìm kiếm và sắp xếp từ request
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const sort_order = req.query.sort_order || 'desc';
      
      // Gọi service với các tham số
      const result = await getAllCombos({ page, limit, search, sort_order });
      
      // Trả về dữ liệu với thông tin phân trang
      res.json({
        message: "Lấy danh sách combo thành công",
        items: result.items,
        pagination: result.pagination
      });
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
        
        if (!file) {
            return resErrors(res, 400, "Vui lòng tải lên hình ảnh cho combo");
        }
        
        const uploadFileName = file.originalname.split(".")[0];

        // Upload ảnh lên Cloudinary
        let url;
        try {
            url = await uploadToCloudinary(file, uploadFolder, uploadFileName);
        } catch (cloudinaryError) {
            return resErrors(res, 500, "Lỗi khi tải ảnh lên: " + cloudinaryError.message);
        }
        
        // Parse items từ JSON string thành object
        let parsedItems = items;
        if (typeof items === 'string') {
            try {
                parsedItems = JSON.parse(items);
            } catch (e) {
                return resErrors(res, 400, "Format của items không hợp lệ");
            }
        }
        
        if (!Array.isArray(parsedItems)) {
            return resErrors(res, 400, "Items phải là một mảng các món ăn");
        }
        
        // Validate items
        for (const item of parsedItems) {
            if (!item.foodAndDrinkId || !item.quantity) {
                return resErrors(res, 400, "Mỗi item phải có foodAndDrinkId và quantity");
            }
        }
        
        // Gọi service để tạo combo và xử lý transaction
        const newCombo = await createCombo({ 
            name, 
            price, 
            profile_picture: url, 
            items: parsedItems 
        });

        resData(res, 201, "Tạo combo thành công!", newCombo);
    } catch (error) {
        console.error("Error while creating combo:", error.message);
        resErrors(res, 500, error.message || "Lỗi khi tạo combo");
    }
}

 static async update(req, res) {
  try {    
    const { id } = req.params;
    const { name, price, items } = req.body;
    
    // Kiểm tra và parse items nếu cần
    let parsedItems = items;
    if (typeof items === 'string') {
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        console.error("Error parsing items:", e);
        return resErrors(res, 400, "Format của items không hợp lệ");
      }
    }
    
    // Chuẩn bị dữ liệu cập nhật
    const updateData = { name, price };
    
    // Xử lý file nếu có
    const file = req.file;
    if (file) {
      try {
        const uploadFileName = `combo_${Date.now()}_${file.originalname.split(".")[0]}`;
        const url = await uploadToCloudinary(file, uploadFolder, uploadFileName);
        updateData.profile_picture = url;
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        return resErrors(res, 500, "Lỗi khi tải lên hình ảnh");
      }
    }
    
    // Thêm items vào dữ liệu cập nhật nếu có
    if (parsedItems) {
      updateData.ComboItems = parsedItems;
    }
    
    // Gọi service để cập nhật combo
    const updatedCombo = await updateCombo(id, updateData);
    
    resData(res, 200, "Cập nhật combo thành công", updatedCombo);
  } catch (error) {
    // Log lỗi và gửi phản hồi lỗi về client
    console.error("Lỗi khi cập nhật combo", error);
    console.error("ERROR STACK:", error.stack);
    resErrors(res, 500, error.message || "Lỗi khi cập nhật combo");
  }
}


  static async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await deleteCombo(id);

      res.json(result)
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
