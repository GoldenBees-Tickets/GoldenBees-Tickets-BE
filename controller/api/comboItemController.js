const { resErrors, resData } = require("../common/common"); 
const {
    getAllComboItems,
    getComboItem,
    createComboItem,
    updateComboItem,
    deleteComboItem
} = require("../../service/comboItemService"); 

class ApiComboItemController {
    // Lấy tất cả các ComboItem
    static async index(req, res) {
        try {
            const comboItems = await getAllComboItems();
            const message = "Lấy danh sách combo items thành công";
            resData(res, 200, message, comboItems);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách combo items", error.message);
            resErrors(res, 500, error.message || "Lỗi khi lấy danh sách combo items");
        }
    }

    // Lấy thông tin ComboItem theo ID
    static async show(req, res) {
        try {
            const { id } = req.params;
            const comboItem = await getComboItem(id);
            if (comboItem) {
                const message = "Lấy thông tin combo item thành công";
                resData(res, 200, message, comboItem);
            } else {
                resErrors(res, 404, "Không tìm thấy combo item");
            }
        } catch (error) {
            console.error("Lỗi khi lấy thông tin combo item", error.message);
            resErrors(res, 500, error.message || "Lỗi khi lấy thông tin combo item");
        }
    }

    // Tạo mới một ComboItem
    static async create(req, res) {
        try {
            const { combo_id, product_id, quantity } = req.body;
            const newComboItem = await createComboItem({ combo_id, product_id, quantity });
            const message = "Tạo mới combo item thành công";
            resData(res, 201, message, newComboItem);
        } catch (error) {
            console.error("Lỗi khi tạo combo item", error.message);
            resErrors(res, 500, error.message || "Lỗi khi tạo combo item");
        }
    }

    // Cập nhật thông tin ComboItem
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { combo_id, product_id, quantity } = req.body;
            const updatedComboItem = await updateComboItem(id, { combo_id, product_id, quantity });
            const message = "Cập nhật combo item thành công";
            resData(res, 200, message, updatedComboItem);
        } catch (error) {
            console.error("Lỗi khi cập nhật combo item", error.message);
            resErrors(res, 500, error.message || "Lỗi khi cập nhật combo item");
        }
    }

    // Xóa ComboItem (xóa mềm)
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await deleteComboItem(id);
            const message = "Xóa combo item thành công";
            resData(res, 200, message);
        } catch (error) {
            console.error("Lỗi khi xóa combo item", error.message);
            resErrors(res, 500, error.message || "Lỗi khi xóa combo item");
        }
    }
}

module.exports = ApiComboItemController;
