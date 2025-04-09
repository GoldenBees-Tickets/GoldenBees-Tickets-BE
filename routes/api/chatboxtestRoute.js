const express = require("express");
const router = express.Router();

const chatbotTestController = require("../../controller/api/chatboxtest");

router.get("/cinemas", chatbotTestController.index);
router.get("/movies", chatbotTestController.index2);
router.get("/rooms", chatbotTestController.index3);
router.get("/seat/:id", chatbotTestController.index4);

// Thêm routes mới cho combo
router.get("/combos", chatbotTestController.getCombos);
router.get("/combo/:id", chatbotTestController.getComboDetail);

// Thêm routes mới cho thông tin ghế
router.get("/seat-types", chatbotTestController.getSeatTypes);

// Thêm route mới cho việc lấy thông tin giá vé
router.get("/price-settings/:id", chatbotTestController.getPriceSettings);

// Thêm routes mới cho Showtime
router.get("/showtimes", chatbotTestController.getShowtimes);
router.get("/showtime/:id", chatbotTestController.getShowtimeDetail);
router.get("/movie/:id/showtimes", chatbotTestController.getShowtimesByMovie);

module.exports = router;
