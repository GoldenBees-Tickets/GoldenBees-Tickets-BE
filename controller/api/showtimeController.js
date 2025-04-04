const { getAllShowtime, createShowtime, check_Existing_Showtime, getShowtimesByMovieId, getShowtimeById } = require("../../service/showtimeService");
const { resErrors, resData } = require("../common/common");

class ApiShowtimeController {
    static async index(req, res) {
        try {
            const branch_id = req.params.id;
            
            const showtimes = await getAllShowtime(branch_id);        

            resData(res, 200, "Get showtimes successfully", showtimes);
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
            const showtimes = await getShowtimesByMovieId(movie_id);
            res.json(showtimes);
        } catch (error) {
            console.error("Error showtime:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async checkShowtime(req, res) {
        try {
            const { room_id, start_time, end_time } = req.body;
            
            const conflictShowtime = await check_Existing_Showtime({ room_id, start_time, end_time });
            if(conflictShowtime) {
                resData(res, 409, "Suất chiếu bị trùng với suất khác, vui lòng chọn thời gian khác!", conflictShowtime);
            } else {
                resData(res, 200);
            }
        } catch (error) {
            console.error("Error showtime:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async create(req, res) {
        try {
            const datas = req.body;
                        
            const showtime = await createShowtime(datas);
            res.json(showtime);
        } catch (error) {
            console.error("Error create showtime:", error);
            resErrors(res, 500, error.message || "Internal Server Error");   
        }
    }
}
module.exports = ApiShowtimeController;