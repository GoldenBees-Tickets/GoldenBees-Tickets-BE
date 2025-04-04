const { Op } = require("sequelize");
const { Showtime, Movie, Room, Cinema } = require("../models");
const moment = require("moment-timezone");

const getAllShowtime = async (branch_id) => {
  try {
    const showtimes = await Showtime.findAll({
      include: [
        {
          model: Movie,
        },
        {
          model: Room,
          attributes: ["name"],
          include: [
            {
              model: Cinema,
              attributes: ["name"],
              required: true, // Bắt buộc phải có Cinema thỏa mãn
            },
          ],
          required: true, // Bắt buộc phải có Room thỏa mãn
        },
      ],
      where: {
        "$Room.Cinema.branch_id$": branch_id, // Lọc trực tiếp theo branch_id
      },
    });
    return showtimes;
  } catch (error) {
    console.error("Error fetching list of showtimes:", error.message);
    throw error;
  }
};

const getShowtimesByMovieId = async (movie_id) => {
  try {
    const showtimes = await Showtime.findAll({
      where: { movie_id },
      include: [
        {
          model: Room,
          attributes: ["id", "name", "cinema_id"],
          include: [
            {
              model: Cinema,
              attributes: ["id", "name"], // Lấy thông tin rạp chiếu
            },
          ],
        },
      ],
    });

    const groupedByDate = showtimes.reduce((dateAcc, showtime) => {
      const cinema = showtime.Room.Cinema;
      if (!cinema) return dateAcc; // Tránh lỗi nếu không có cinema

      const dateObj = new Date(showtime.start_time);
      const showDate = `${String(dateObj.getDate()).padStart(2, "0")}-${String(
        dateObj.getMonth() + 1
      ).padStart(2, "0")}`; // Định dạng DD-MM

      // Lấy thứ trong tuần (VD: "Thứ Hai", "Chủ Nhật")
      const showDay = dateObj.toLocaleDateString("vi-VN", { weekday: "long" });

      if (!dateAcc[showDate]) {
        dateAcc[showDate] = { date: showDate, day: showDay, cinemas: {} };
      }

      if (!dateAcc[showDate].cinemas[cinema.id]) {
        dateAcc[showDate].cinemas[cinema.id] = {
          cinema_id: cinema.id,
          cinema_name: cinema.name,
          showtimes: [],
        };
      }

      const showTime = dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }); // Lấy giờ và phút

      dateAcc[showDate].cinemas[cinema.id].showtimes.push({
        id: showtime.id,
        time: showTime,
        room_id: showtime.Room.id,
        room_name: showtime.Room.name,
      });

      // Sắp xếp showtimes theo thời gian (từ nhỏ đến lớn)
      dateAcc[showDate].cinemas[cinema.id].showtimes.sort((a, b) =>
        a.time.localeCompare(b.time)
      );

      return dateAcc;
    }, {});

    // Convert object thành mảng theo format mong muốn
    let result = Object.values(groupedByDate).map(({ date, day, cinemas }) => ({
      date,
      day,
      cinemas: Object.values(cinemas),
    }));

    // Sắp xếp theo ngày tăng dần
    result.sort((a, b) => new Date(a.date) - new Date(b.date));

    return { status: 200, message: "Get showtimes successfully", data: result };
  } catch (error) {
    console.error("Error fetching showtimes:", error.message);
    throw error;
  }
};

const getShowtimeById = async (id) => {
  try {
    const showtime = await Showtime.findOne({
      where: { id },
      include: [
        {
          model: Room,
          attributes: ["id", "name", "cinema_id"], // Chỉ lấy cần thiết
          include: [
            {
              model: Cinema,
              attributes: ["id", "name"], // Lấy tên rạp
            },
          ],
        },
        {
          model: Movie,
          attributes: ["id", "name", "duration", "poster", "age_rating"], // Lấy thông tin phim
        },
      ],
    });    

    if (!showtime) {
      return { status: 404, message: "Showtime not found" };
    }

    // Tách thời gian
    const startTime = new Date(showtime.start_time);
    const formattedStartTime = {
      dayOfWeek: startTime.toLocaleDateString("vi-VN", { weekday: "long" }), // "Thứ Ba"
      date: startTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }), // "11/03/2025"
      time: startTime.toTimeString().slice(0, 5), // "16:12"
    };
    

    // Chuẩn bị kết quả
    const response = {
      status: 200,
      message: "Get showtime success",
      showtime: {
        id: showtime.id,
        start_time: formattedStartTime,
        base_price: showtime.base_price,
        room: {
          id: showtime.Room?.id,
          name: showtime.Room?.name,
          cinema: {
            id: showtime.Room?.Cinema?.id,
            name: showtime.Room?.Cinema?.name,
          },
        },
        movie: showtime.Movie,
      },
    };

    return response;
  } catch (error) {
    console.error("Error fetching showtime:", error.message);
    throw error;
  }
};


const check_Existing_Showtime = async ({ room_id, start_time, end_time }) => {
  try {
    const startTime = moment(start_time)
      .tz("Asia/Bangkok")
      .add(7, "hours")
      .format("YYYY-MM-DD HH:mm:ss");
    const endTime = moment(end_time)
      .tz("Asia/Bangkok")
      .add(7, "hours")
      .format("YYYY-MM-DD HH:mm:ss");

    const existingShowtime = await Showtime.findOne({
      where: {
        room_id,
        [Op.or]: [
          {
            start_time: { [Op.between]: [startTime, endTime] },
          },
          {
            end_time: { [Op.between]: [startTime, endTime] },
          },
          {
            [Op.and]: [
              { start_time: { [Op.lte]: startTime } },
              { end_time: { [Op.gte]: endTime } },
            ],
          },
        ],
      },
    });
    return existingShowtime;
  } catch (error) {
    console.error("Error creating showtime:", error.message);
    throw error;
  }
};

const createShowtime = async (datas) => {
  try {
    const showtimes = await Promise.all(
      datas.map(async (data) => {
        return await Showtime.create({
          room_id: data.room_id,
          movie_id: data.movie_id,
          start_time: data.start_time,
          end_time: data.end_time,
          base_price: data.base_price,
        });
      })
    );
    return { status: 200, message: "Tạo suất chiếu thành công", showtimes }; // Trả về danh sách showtime đã tạo
  } catch (error) {
    console.error("Error creating showtimes:", error.message);
    throw error;
  }
};

const updateShowtime = async ({ id, status }) => {
  try {
    const seat_type = await Showtime.update({ status }, { where: { id } });
    return seat_type;
  } catch (error) {
    console.error("Error updating showtime:", error.message);
    throw error;
  }
};

module.exports = {
  getAllShowtime,
  createShowtime,
  updateShowtime,
  check_Existing_Showtime,
  getShowtimesByMovieId,
  getShowtimeById,
};
