const express = require("express");
const router = express.Router();
const ApiPromotionController = require("../../controller/api/promotionController");
const AuthorizationBranchAdmin = require("../../middleware/authorizationBranchAdmin");

router.get("/", ApiPromotionController.index);           // Get all promotions
router.get("/:id", ApiPromotionController.show);          // Get a specific promotion by ID
router.post("/", AuthorizationBranchAdmin, ApiPromotionController.create);          // Create a new promotion
router.put("/:id", AuthorizationBranchAdmin, ApiPromotionController.update);        // Update a promotion by ID
router.delete("/:id", AuthorizationBranchAdmin, ApiPromotionController.delete);     // Delete a promotion by ID
router.post("/check", ApiPromotionController.checkPromotion); // Check if a promotion code is valid

module.exports = router;
