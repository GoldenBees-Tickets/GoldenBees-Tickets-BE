const { getOrderByUserId, getAllOrders, getOrdersPagination, getAllOrdersByBranchService, getListOrdersByBranchIdService } = require("../../service/orderService");
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
      console.error("Error getting all orders:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async getAllOrderPaginationController(req, res) {
    
    try {
        let page = parseInt(req.query.page);
      
        if (isNaN(page)) page = null;    
                
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sort_order = req.query.sort_order || 'desc';

        const result = await getOrdersPagination({ page, limit, search, sort_order });
        // Format response to match expected structure
        const response = {
          status: 200,
          success: true,
          error: null,
          data: result.orders || [],
          pagination: result.pagination
        };

        res.json(response);
    } catch (error) {
      console.error("Error getting orders with pagination:", error);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async getListOrdersByBranchIdController(req, res) {
    
    try {
        const {id} = req.params;
        let page = parseInt(req.query.page);
      
        if (isNaN(page)) page = null;    
                
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sort_order = req.query.sort_order || 'desc';

        const result = await getListOrdersByBranchIdService(id, { page, limit, search, sort_order });
        // Format response to match expected structure
        const response = {
          status: 200,
          success: true,
          error: null,
          data: result.orders || [],
          pagination: result.pagination
        };

        res.json(response);
    } catch (error) {
      console.error("Error getting orders with pagination:", error);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async getAllOrdersByBranchController(req, res) {
    try {
      const {id} = req.params;
      const orders = await getAllOrdersByBranchService(id);
      res.json(orders);
    } catch (error) {
      console.error("Error getting all orders by branch:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }


}

module.exports = ApiOrderDataController;
