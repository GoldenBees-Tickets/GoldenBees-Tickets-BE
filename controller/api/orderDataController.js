const { getOrderByUserId, getAllOrders } = require("../../service/orderService");
const { resErrors } = require("../common/common");


class ApiOrderDataController {
  static async getOrderByUserId(req, res) {
    try {
      const user_id = req.params.id;
      const orders = await getOrderByUserId(user_id);
     res.json(orders);
    } catch (error) {
      console.error(error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async getAllOrdersController(req, res) {
    try {
      const orders = await getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error deleting movie-producer link:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }
}

module.exports = ApiOrderDataController;
