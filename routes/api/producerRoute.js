const express = require("express");
const router = express.Router();
const ApiProducerController = require("../../controller/api/producerController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");
const upload = require("../../utils/multer");

router.get("/", ApiProducerController.index);
router.get("/getAll", ApiProducerController.getAll);

router.get("/:id", ApiProducerController.show);

router.post(
  "/", AuthorizationAdmin,
  upload.single("profile_picture"),
  ApiProducerController.create
);

router.put(
  "/:id", AuthorizationAdmin,
  upload.single("profile_picture"),
  ApiProducerController.update
);

// Xóa producer theo ID
router.delete("/:id", AuthorizationAdmin, ApiProducerController.delete);

module.exports = router;
