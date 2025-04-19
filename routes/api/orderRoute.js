const express = require("express");
const router = express.Router();
const ApiOrderontroller = require("../../controller/api/orderController");
const ApiOrderDataController = require("../../controller/api/orderDataController");

const AuthorizationAdmin = require("../../middleware/authorizationAdmin");
router.get("/getAllPagination", AuthorizationAdmin, ApiOrderDataController.getAllOrderPaginationController);

router.post("/pay-with-momo", ApiOrderontroller.payWithMoMo);
router.post("/callback", ApiOrderontroller.handleCallback);
router.post("/client-callback", ApiOrderontroller.handleClientCallback);
router.get("/status/:orderId", ApiOrderontroller.checkPaymentStatus);

router.get("/:id", ApiOrderDataController.getOrderByUserId);
router.get("/", AuthorizationAdmin, ApiOrderDataController.getAllOrdersController);

module.exports = router;
