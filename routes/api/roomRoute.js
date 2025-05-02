const express = require("express");
const router = express.Router();
const ApiRoomController = require("../../controller/api/roomController");
// const AuthorizationAdmin = require("../../middleware/authorizationAdmin");
const AuthorizationBranchAdmin = require("../../middleware/authorizationBranchAdmin");

router.get("/", ApiRoomController.index);
router.get("/:id", ApiRoomController.show);
router.get("/seats/:id", ApiRoomController.getSeatsByRoomId);
router.get("/cinema/:id", ApiRoomController.showByCinemaId);
router.post("/", AuthorizationBranchAdmin, ApiRoomController.create);
router.put("/:id", AuthorizationBranchAdmin, ApiRoomController.update);
// router.post("/", AuthorizationAdmin, ApiRoomController.create);
// router.put("/:id", AuthorizationAdmin, ApiRoomController.update);

module.exports = router;
