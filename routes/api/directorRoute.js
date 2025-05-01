

const express = require("express");
const router = express.Router();
const ApiDirectorController = require("../../controller/api/directorController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

const upload = require("../../utils/multer");

router.get("/", ApiDirectorController.index);
router.get("/getAll", ApiDirectorController.getAll);
router.get("/:id", ApiDirectorController.show);
router.post("/", AuthorizationAdmin, upload.single("profile_picture"), ApiDirectorController.create);
router.put("/:id", AuthorizationAdmin, upload.single("profile_picture"), ApiDirectorController.update);
router.delete("/:id", AuthorizationAdmin, ApiDirectorController.delete);

module.exports = router;
