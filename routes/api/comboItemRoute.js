const express = require("express");
const router = express.Router();
const ApiComboItemController = require("../../controller/api/comboItemController");

router.get("/", ApiComboItemController.index);
router.get("/:id", ApiComboItemController.show);
router.post("/", ApiComboItemController.create);
router.put("/:id", ApiComboItemController.update);
router.delete("/:id", ApiComboItemController.delete);

module.exports = router;
