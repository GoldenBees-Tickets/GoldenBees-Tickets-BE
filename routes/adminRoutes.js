// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken, checkAdminRole, ADMIN_TYPES } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const branchController = require('../controllers/branchController');
const movieController = require('../controllers/movieController');
const cinemaController = require('../controllers/cinemaController');
const roomController = require('../controllers/roomController');
const showtimeController = require('../controllers/showtimeController');
const discountController = require('../controllers/discountController');
const foodController = require('../controllers/foodController');
const seatTypeController = require('../controllers/seatTypeController');

// Middleware để bắt buộc tất cả routes đều cần xác thực admin
router.use(authenticateToken);

// ========== PHÂN QUYỀN ADMIN TỔNG ==========
// Routes dành cho Admin Tổng (Super Admin)
const superAdminRoutes = express.Router();
superAdminRoutes.use(checkAdminRole(ADMIN_TYPES.SUPER_ADMIN));

// Quản lý Chi nhánh
superAdminRoutes.get('/branches', branchController.getAllBranches);
superAdminRoutes.post('/branches', branchController.createBranch);
superAdminRoutes.put('/branches/:id', branchController.updateBranch);
superAdminRoutes.delete('/branches/:id', branchController.deleteBranch);

// Quản lý Phim
superAdminRoutes.post('/movies', movieController.createMovie);
superAdminRoutes.put('/movies/:id', movieController.updateMovie);
superAdminRoutes.delete('/movies/:id', movieController.deleteMovie);

// Quản lý Thể loại
superAdminRoutes.post('/genres', adminController.createGenre);
superAdminRoutes.put('/genres/:id', adminController.updateGenre);
superAdminRoutes.delete('/genres/:id', adminController.deleteGenre);

// Quản lý Diễn viên, Đạo diễn, Nhà sản xuất
superAdminRoutes.post('/actors', adminController.createActor);
superAdminRoutes.put('/actors/:id', adminController.updateActor);
superAdminRoutes.delete('/actors/:id', adminController.deleteActor);

superAdminRoutes.post('/directors', adminController.createDirector);
superAdminRoutes.put('/directors/:id', adminController.updateDirector);
superAdminRoutes.delete('/directors/:id', adminController.deleteDirector);

superAdminRoutes.post('/producers', adminController.createProducer);
superAdminRoutes.put('/producers/:id', adminController.updateProducer);
superAdminRoutes.delete('/producers/:id', adminController.deleteProducer);

// Quản lý Loại ghế
superAdminRoutes.post('/seat-types', seatTypeController.createSeatType);
superAdminRoutes.put('/seat-types/:id', seatTypeController.updateSeatType);
superAdminRoutes.delete('/seat-types/:id', seatTypeController.deleteSeatType);

// Quản lý Mã giảm giá
superAdminRoutes.post('/discounts', discountController.createDiscount);
superAdminRoutes.put('/discounts/:id', discountController.updateDiscount);
superAdminRoutes.delete('/discounts/:id', discountController.deleteDiscount);

// Quản lý Combo và Món ăn
superAdminRoutes.post('/food-categories', foodController.createFoodCategory);
superAdminRoutes.put('/food-categories/:id', foodController.updateFoodCategory);
superAdminRoutes.delete('/food-categories/:id', foodController.deleteFoodCategory);

superAdminRoutes.post('/food-items', foodController.createFoodItem);
superAdminRoutes.put('/food-items/:id', foodController.updateFoodItem);
superAdminRoutes.delete('/food-items/:id', foodController.deleteFoodItem);

// ========== PHÂN QUYỀN ADMIN CHI NHÁNH ==========
// Routes dành cho Admin Chi Nhánh (Branch Admin)
const branchAdminRoutes = express.Router();
branchAdminRoutes.use(checkAdminRole(ADMIN_TYPES.BRANCH_ADMIN));

// Quản lý Rạp (giới hạn theo chi nhánh)
branchAdminRoutes.get('/cinemas', cinemaController.getCinemasByBranch);
branchAdminRoutes.post('/cinemas', cinemaController.createCinema);
branchAdminRoutes.put('/cinemas/:id', cinemaController.updateCinema);
branchAdminRoutes.delete('/cinemas/:id', cinemaController.deleteCinema);

// Quản lý Phòng (giới hạn theo chi nhánh)
branchAdminRoutes.get('/rooms', roomController.getRoomsByCinema);
branchAdminRoutes.post('/rooms', roomController.createRoom);
branchAdminRoutes.put('/rooms/:id', roomController.updateRoom);
branchAdminRoutes.delete('/rooms/:id', roomController.deleteRoom);

// Quản lý Suất chiếu
branchAdminRoutes.get('/showtimes', showtimeController.getShowtimesByCinema);
branchAdminRoutes.post('/showtimes', showtimeController.createShowtime);
branchAdminRoutes.put('/showtimes/:id', showtimeController.updateShowtime);
branchAdminRoutes.delete('/showtimes/:id', showtimeController.deleteShowtime);

// Tùy chỉnh Combo/Món ăn theo khu vực
branchAdminRoutes.get('/branch-food-items', foodController.getFoodItemsByBranch);
branchAdminRoutes.put('/branch-food-items/:id', foodController.updateBranchFoodItem);

// Hỗ trợ người dùng
branchAdminRoutes.get('/bookings', adminController.getBookingsByBranch);
branchAdminRoutes.put('/bookings/:id', adminController.updateBookingStatus);
branchAdminRoutes.get('/customer-support', adminController.getCustomerSupportRequests);
branchAdminRoutes.put('/customer-support/:id', adminController.resolveCustomerSupportRequest);

// ========== ROUTES CHUNG CHO TẤT CẢ ADMIN ==========
// Routes mà cả Admin Tổng và Admin Chi Nhánh đều có thể truy cập
const commonAdminRoutes = express.Router();

// Xem danh sách chung
commonAdminRoutes.get('/movies', movieController.getAllMovies);
commonAdminRoutes.get('/genres', adminController.getAllGenres);
commonAdminRoutes.get('/actors', adminController.getAllActors);
commonAdminRoutes.get('/directors', adminController.getAllDirectors);
commonAdminRoutes.get('/producers', adminController.getAllProducers);
commonAdminRoutes.get('/seat-types', seatTypeController.getAllSeatTypes);
commonAdminRoutes.get('/discounts', discountController.getAllDiscounts);
commonAdminRoutes.get('/food-categories', foodController.getAllFoodCategories);
commonAdminRoutes.get('/food-items', foodController.getAllFoodItems);

// Dashboard và báo cáo
commonAdminRoutes.get('/dashboard', adminController.getDashboardStats);
commonAdminRoutes.get('/reports/sales', adminController.getSalesReport);
commonAdminRoutes.get('/reports/bookings', adminController.getBookingsReport);

// ========== ĐĂNG KÝ ROUTES ==========
// Đăng ký các nhóm routes
router.use('/super', superAdminRoutes);        // Prefix /api/admin/super
router.use('/branch', branchAdminRoutes);      // Prefix /api/admin/branch
router.use('/', commonAdminRoutes);            // Prefix /api/admin

module.exports = router;