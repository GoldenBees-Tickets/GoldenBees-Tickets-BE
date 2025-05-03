const express = require("express");
const router = express.Router();
const ApiPostController = require("../../controller/api/postController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");
const upload = require("../../utils/multer");

// Public routes
router.get("/", ApiPostController.index);
router.get("/getAll", ApiPostController.getPostNotPageController);
router.get("/search", ApiPostController.search);
router.get("/:id", ApiPostController.show);

// Admin routes
router.post("/", AuthorizationAdmin, upload.single("thumbnail"), ApiPostController.create);
router.put("/:id", AuthorizationAdmin, upload.single("thumbnail"), ApiPostController.update);
router.delete("/:id", AuthorizationAdmin, ApiPostController.destroy);

module.exports = router; 