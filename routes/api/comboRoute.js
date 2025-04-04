const express = require("express");
const router = express.Router();
const ApiComboController = require("../../controller/api/comboController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

const upload = require("../../utils/multer");

router.get("/", ApiComboController.index);
router.get("/:id", ApiComboController.show);
router.put("/:id", AuthorizationAdmin, upload.single("profile_picture"), ApiComboController.update);
router.delete("/:id", AuthorizationAdmin, ApiComboController.delete);
router.post("/", AuthorizationAdmin, upload.single("profile_picture"), ApiComboController.create);
module.exports = router;
