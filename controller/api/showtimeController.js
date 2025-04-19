const { getAllShowtime, createShowtime, check_Existing_Showtime, getShowtimesByMovieId, getShowtimeById, updateShowtime } = require("../../service/showtimeService");
const { resErrors, resData } = require("../common/common");

class ApiShowtimeController {
    static async index(req, res) {
        try {
            const branch_id = req.params.id;
            const { page = 1, limit = 5, search = "", status = "all", sort_order = "desc" } = req.query;
            
            // Chuyển đổi page và limit thành số
            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
            
            // Validate page và limit
            if (isNaN(pageNumber) || pageNumber < 1) {
                return resErrors(res, 400, "Page phải là số nguyên dương");
            }
            if (isNaN(limitNumber) || limitNumber < 1) {
                return resErrors(res, 400, "Limit phải là số nguyên dương");
            }
            
            // Chuẩn bị options cho service
            const options = {
                page: pageNumber,
                limit: limitNumber,
                search,
                status,
                sort_order,
                branch_id
            };
            
            const showtimes = await getAllShowtime(options);        
            return res.json(showtimes);
        } catch (error) {
            console.error("Error showtime:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async show(req, res) {
        try {
            const {id} = req.params;
            
            const data = await getShowtimeById(id);
            res.json(data);
        } catch (error) {
            console.error("Error showtime:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async getByMovieId(req, res) {
        try {
            const movie_id = req.params.id;
            
            // Lấy các tham số query
            const { branch_id, cinema_id, current_time } = req.query;
            
            // Chuẩn bị options cho service
            const options = {
                branch_id: branch_id || undefined,
                cinema_id: cinema_id || undefined,
                current_time: current_time === 'true'
            };
            
            // Gọi service với options
            const showtimes = await getShowtimesByMovieId(movie_id, options);
            
            res.json(showtimes);
        } catch (error) {
            console.error("Error showtime:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async checkShowtime(req, res) {
        try {
            const { room_id, show_date, start_time, end_time } = req.body;
            
            
            if (!room_id || !show_date || !start_time || !end_time) {
                return resErrors(res, 400, "Vui lòng cung cấp đầy đủ thông tin: room_id, show_date, start_time, end_time");
            }
            
            const conflictShowtime = await check_Existing_Showtime({ room_id, show_date, start_time, end_time });
            if(conflictShowtime) {
                resData(res, 409, "Suất chiếu bị trùng với suất khác, vui lòng chọn thời gian khác!", conflictShowtime);
            } else {
                resData(res, 200, "Thời gian suất chiếu hợp lệ");
            }
        } catch (error) {
            console.error("Error showtime:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async create(req, res) {
        try {
            const datas = req.body;
            
            // Kiểm tra dữ liệu đầu vào
            for (const data of datas) {
                if (!data.room_id || !data.movie_id || !data.show_date || !data.start_time || !data.end_time || !data.base_price) {
                    return resErrors(res, 400, "Vui lòng cung cấp đầy đủ thông tin cho mỗi suất chiếu: room_id, movie_id, show_date, start_time, end_time, base_price");
                }
            }
                        
            const showtime = await createShowtime(datas);
            res.json(showtime);
        } catch (error) {
            console.error("Error create showtime:", error);
            resErrors(res, 500, error.message || "Internal Server Error");   
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            // Kiểm tra xem id có tồn tại không
            if (!id) {
                return resErrors(res, 400, "Vui lòng cung cấp ID suất chiếu");
            }
            
            // Nếu có cập nhật thời gian, kiểm tra xung đột
            if ((updateData.room_id || updateData.show_date || updateData.start_time || updateData.end_time) && 
                (updateData.room_id && updateData.show_date && updateData.start_time && updateData.end_time)) {
                
                const existingShowtime = await check_Existing_Showtime({ 
                    room_id: updateData.room_id, 
                    show_date: updateData.show_date,
                    start_time: updateData.start_time, 
                    end_time: updateData.end_time 
                });
                
                if (existingShowtime && existingShowtime.id != id) {
                    return resData(res, 409, "Suất chiếu bị trùng với suất khác, vui lòng chọn thời gian khác!", existingShowtime);
                }
            }
            
            const result = await updateShowtime(id, updateData);
            res.json(result);
        } catch (error) {
            console.error("Error updating showtime:", error);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }
}
module.exports = ApiShowtimeController;