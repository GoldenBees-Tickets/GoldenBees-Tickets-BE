
const express = require('express');
const router = express.Router();

const ApiUserController = require("../../controller/api/userController");
const Authorization = require("../../middleware/authentication");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

const upload = require("../../utils/multer");

router.get("/", AuthorizationAdmin, ApiUserController.index);
router.get("/star/:id", Authorization, ApiUserController.getStarUserController);
router.get("/admin_branches", AuthorizationAdmin, ApiUserController.getAdminBranches);
router.post("/", AuthorizationAdmin, ApiUserController.create);
router.get("/:id", ApiUserController.show);
router.patch("/:id", Authorization, upload.single('image'), ApiUserController.update);
router.put("/status/:id", AuthorizationAdmin, ApiUserController.updateStatusUser);
router.put("/admin/:id", AuthorizationAdmin, ApiUserController.updateAdminController);

module.exports = router;