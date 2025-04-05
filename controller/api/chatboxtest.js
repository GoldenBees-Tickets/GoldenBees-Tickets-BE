const { resErrors, resData } = require("../common/common");
const { getAllCinemas } = require("../../service/cinemaService");
const { getAllMovies } = require("../../service/movieSevice");
const { getAllRoom } = require("../../service/roomService");
const { getAllSeat } = require("../../service/seatService");
const { getAllCombos } = require("../../service/comboService");

class chatbotTestController {
  static async index(req, res) {
    try {
      const cinemas = await getAllCinemas();

      const cinemaList = cinemas.map((cinema) => ({
        id: cinema.dataValues.id,
        name: cinema.dataValues.name,
        city: cinema.dataValues.city,
        district: cinema.dataValues.district,
        address: `${cinema.dataValues.street}, ${cinema.dataValues.ward}, ${cinema.dataValues.district}, ${cinema.dataValues.city}`,
        branchId: cinema.dataValues.branch_id,
      }));

      res.json({ message: "Get cinemas successfully", cinemas: cinemaList });
    } catch (error) {
      console.error("Error fetching cinemas:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async index2(req, res) {
    try {
      const movies = await getAllMovies();

      const movieList = movies.map((movie) => ({
        id: movie.id,
        name: movie.name,
        description: movie.description,
        trailer: movie.trailer,
        year: movie.year,
        poster: movie.poster,
        ageRating: movie.age_rating,
        duration: movie.duration,
        country: movie.country,
        director: movie.Director
          ? {
              id: movie.Director.id,
              name: movie.Director.name,
              dob: movie.Director.dob,
              bio: movie.Director.bio,
              profilePicture: movie.Director.profile_picture,
            }
          : null,
        genres: movie.MovieGenres
          ? movie.MovieGenres.map((g) => ({ id: g.Genre.id, name: g.Genre.name }))
          : [],
        actors: movie.MovieActors
          ? movie.MovieActors.map((a) => ({
              id: a.Actor.id,
              name: a.Actor.name,
              dob: a.Actor.dob,
              bio: a.Actor.bio,
              profilePicture: a.Actor.profile_picture,
            }))
          : [],
      }));

      res.json({ message: "Movies retrieved successfully", movies: movieList });
    } catch (error) {
      console.error("Error fetching movies:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async index3(req, res) {
    try {
      const rooms = await getAllRoom();

      const roomList = rooms.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        cinemaId: room.cinema_id,
        rowsCount: room.rows_count,
        columnsCount: room.columns_count,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        deletedAt: room.deletedAt,
        cinema: room.Cinema ? { name: room.Cinema.name } : null,
      }));

      res.json({ message: "Get all rooms successfully", data: roomList });
    } catch (error) {
      console.error("Error fetching rooms:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async index4(req, res) {
    try {
      const room_id = req.params.id;
      const seats = await getAllSeat(room_id);

      const seatList = seats.map((seat) => ({
        id: seat.id,
        roomId: seat.room_id,
        seatNumber: seat.seat_number,
        seatRow: seat.seat_row,
        isEnabled: seat.is_enabled,
        typeId: seat.type_id,
        createdAt: seat.createdAt,
        updatedAt: seat.updatedAt,
        deletedAt: seat.deletedAt,
      })) 

      res.json({ message: "Get seats successfully", seats: seats });
    } catch (error) {
      console.error("Error fetching seats:", error);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async getCombos(req, res) {
    try {
      const combos = await getAllCombos();
      
      const comboList = combos.map(combo => {
        const items = combo.ComboItems ? combo.ComboItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          product: item.FoodAndDrink ? {
            id: item.FoodAndDrink.id,
            name: item.FoodAndDrink.name,
            description: item.FoodAndDrink.description,
            price: item.FoodAndDrink.price,
            type: item.FoodAndDrink.type,
            image: item.FoodAndDrink.image
          } : null
        })) : [];
        
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        
        return {
          id: combo.id,
          name: combo.name,
          price: combo.price,
          profilePicture: combo.profile_picture,
          totalItems: totalItems,
          items: items,
          savings: calculateSavings(combo.price, items),
          createdAt: combo.createdAt,
          updatedAt: combo.updatedAt
        };
      });
      
      res.json({ 
        message: "Get combos successfully", 
        combos: comboList 
      });
    } catch (error) {
      console.error("Error fetching combos:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
  
  static async getComboDetail(req, res) {
    try {
      const combo_id = req.params.id;
      const combos = await getAllCombos();
      
      const combo = combos.find(c => c.id == combo_id);
      
      if (!combo) {
        return resErrors(res, 404, "Combo not found");
      }
      
      const items = combo.ComboItems ? combo.ComboItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: item.FoodAndDrink ? {
          id: item.FoodAndDrink.id,
          name: item.FoodAndDrink.name,
          description: item.FoodAndDrink.description,
          price: item.FoodAndDrink.price,
          type: item.FoodAndDrink.type,
          image: item.FoodAndDrink.image
        } : null
      })) : [];
      
      const comboDetail = {
        id: combo.id,
        name: combo.name,
        price: combo.price,
        profilePicture: combo.profile_picture,
        items: items,
        savings: calculateSavings(combo.price, items),
        createdAt: combo.createdAt,
        updatedAt: combo.updatedAt
      };
      
      res.json({ 
        message: "Get combo detail successfully", 
        combo: comboDetail 
      });
    } catch (error) {
      console.error("Error fetching combo detail:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
}

function calculateSavings(comboPrice, items) {
  const totalIndividualPrice = items.reduce((sum, item) => {
    const itemPrice = item.product ? item.product.price * item.quantity : 0;
    return sum + itemPrice;
  }, 0);
  
  const savings = totalIndividualPrice - comboPrice;
  
  return {
    individualTotal: totalIndividualPrice,
    savings: savings,
    savingsPercent: totalIndividualPrice > 0 ? Math.round((savings / totalIndividualPrice) * 100) : 0
  };
}

module.exports = chatbotTestController;
