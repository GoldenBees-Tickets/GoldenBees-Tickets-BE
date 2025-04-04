const express = require("express");
const router = express.Router();
const ApiSeatController = require("../../controller/api/seatController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

router.get("/", ApiSeatController.index);
router.post("/", AuthorizationAdmin, ApiSeatController.create);
router.patch("/", AuthorizationAdmin, ApiSeatController.update);

module.exports = router;
