const express = require("express");
const router = express.Router();
const ApiSeatTypeController = require("../../controller/api/seatTypeController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

router.get("/", ApiSeatTypeController.index);
router.post("/", AuthorizationAdmin, ApiSeatTypeController.create);
router.put("/:id", AuthorizationAdmin, ApiSeatTypeController.update);
router.delete("/:id", AuthorizationAdmin, ApiSeatTypeController.delete);

module.exports = router;
