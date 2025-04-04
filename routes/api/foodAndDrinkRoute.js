const express = require("express");
const router = express.Router();
const ApiFoodAndDrinkController = require("../../controller/api/foodAndDrinkController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

const upload = require("../../utils/multer");

router.get("/", ApiFoodAndDrinkController.index);
router.get("/:id", ApiFoodAndDrinkController.show);
router.put("/:id", AuthorizationAdmin, upload.single("profile_picture"), ApiFoodAndDrinkController.update);
router.delete("/:id", AuthorizationAdmin, ApiFoodAndDrinkController.delete);
router.post("/", AuthorizationAdmin, upload.single("profile_picture"), ApiFoodAndDrinkController.create);
module.exports = router;
