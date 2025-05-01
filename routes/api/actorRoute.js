// routes/api/actor.js

const express = require("express");
const router = express.Router();
const ApiActorController = require("../../controller/api/actorController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

// Khởi tạo middleware upload
const upload = require("../../utils/multer");

router.get("/", ApiActorController.index);
router.get("/getAll", ApiActorController.getAll);
router.get("/:id", ApiActorController.show);

// Ở đây chúng ta dùng field "profile_picture" - khớp với Controller
router.post("/", AuthorizationAdmin, upload.single("profile_picture"), ApiActorController.create);

// Muốn update có thể sửa ảnh => cần upload.single("profile_picture")
router.put("/:id", AuthorizationAdmin, upload.single("profile_picture"), ApiActorController.update);

router.delete("/:id", AuthorizationAdmin, ApiActorController.delete);

module.exports = router;
