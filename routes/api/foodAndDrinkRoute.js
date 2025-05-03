const express = require("express");
const router = express.Router();
const ApiFoodAndDrinkController = require("../../controller/api/foodAndDrinkController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

const upload = require("../../utils/multer");

// Middleware xử lý lỗi upload file
const handleUploadErrors = (req, res, next) => {
    const uploadSingle = upload.single("profile_picture");
    
    uploadSingle(req, res, (err) => {
        if (err) {
            console.error("Lỗi upload file:", err);
            return res.status(400).json({ 
                message: "Lỗi khi tải lên file: " + err.message 
            });
        }
        next();
    });
};

router.get("/", ApiFoodAndDrinkController.index);
router.get("/:id", ApiFoodAndDrinkController.show);
router.put("/:id", AuthorizationAdmin, handleUploadErrors, ApiFoodAndDrinkController.update);
router.delete("/:id", AuthorizationAdmin, ApiFoodAndDrinkController.delete);
router.post("/", AuthorizationAdmin, handleUploadErrors, ApiFoodAndDrinkController.create);

module.exports = router;
