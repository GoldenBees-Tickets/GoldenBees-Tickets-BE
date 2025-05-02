const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.MYSQLDATABASE, process.env.MYSQLUSER, process.env.MYSQLPASSWORD, {
  host: "localhost",
  dialect: "mysql",
  logging: false // Tắt logging SQL queries
});
sequelize
  .authenticate()
  .then(() => console.log("Kết nối thành công!"))
  .catch((e) => console.error("Kết nối thất bại:", e));

const models = {};

// Import tất cả các models
const modelFiles = fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"));

for (const file of modelFiles) {
  const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
  models[model.name] = model;
}

// Gọi associate nếu tồn tại
if (models.Ticket1 && models.Ticket1.associate) {
  models.Ticket1.associate(models);
}

// Destructure các models
const {
  Branch,
  Cinema,
  Director,
  Producer,
  MovieProducer,
  Actor,
  MovieActor,
  Movie,
  Genre,
  MovieGenre,
  Showtime,
  Seat,
  Room,
  SeatStatus,
  BlockSeat,
  User,
  SeatType,
  Ticket,
  Review,
  Combo,
  ComboItem,
  FoodAndDrink,
  Order,
  PriceSetting,
  Promotion,
  PromotionUsage,
  OrderCombo,
  ChatHistory
} = models;

Order.hasMany(Ticket, { foreignKey: "order_id" });
Ticket.belongsTo(Order, { foreignKey: "order_id" });

Order.hasMany(PromotionUsage, { foreignKey: "order_id" });
PromotionUsage.belongsTo(Order, { foreignKey: "order_id" });

Order.belongsTo(Showtime, { foreignKey: "showtime_id" });
Showtime.hasMany(Order, { foreignKey: "showtime_id" });

OrderCombo.belongsTo(Order, { foreignKey: "order_id" });
Order.hasMany(OrderCombo, { foreignKey: "order_id" });

OrderCombo.belongsTo(Combo, { foreignKey: "combo_id" });
Combo.hasMany(OrderCombo, { foreignKey: "combo_id" });

Order.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Order, { foreignKey: "user_id" });

Promotion.hasMany(PromotionUsage, { foreignKey: "promotion_id" });
PromotionUsage.belongsTo(Promotion, { foreignKey: "promotion_id" });

PromotionUsage.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(PromotionUsage, { foreignKey: "user_id" });

Branch.hasMany(User, { foreignKey: "branch_id" });
User.belongsTo(Branch, { foreignKey: "branch_id" });

Branch.hasMany(Cinema, { foreignKey: "branch_id" });
Cinema.belongsTo(Branch, { foreignKey: "branch_id" });

Cinema.hasMany(Room, { foreignKey: "cinema_id" });
Room.belongsTo(Cinema, { foreignKey: "cinema_id" });

Director.hasMany(Movie, { foreignKey: "director_id" });
Movie.belongsTo(Director, { foreignKey: "director_id" });

Movie.belongsToMany(Producer, {
  through: MovieProducer,
  foreignKey: "movie_id",
});
Producer.belongsToMany(Movie, {
  through: MovieProducer,
  foreignKey: "producer_id",
});

MovieProducer.belongsTo(Movie, { foreignKey: "movie_id", onDelete: "CASCADE" });
MovieProducer.belongsTo(Producer, {
  foreignKey: "producer_id",
  onDelete: "CASCADE",
});

Movie.hasMany(MovieProducer, { foreignKey: "movie_id" });
Producer.hasMany(MovieProducer, { foreignKey: "producer_id" });

Movie.belongsToMany(Actor, { through: MovieActor, foreignKey: "movie_id" });
Actor.belongsToMany(Movie, { through: MovieActor, foreignKey: "actor_id" });

MovieActor.belongsTo(Movie, { foreignKey: "movie_id", onDelete: "CASCADE" });
MovieActor.belongsTo(Actor, { foreignKey: "actor_id", onDelete: "CASCADE" });

Movie.hasMany(MovieActor, { foreignKey: "movie_id" });
Actor.hasMany(MovieActor, { foreignKey: "actor_id" });

Movie.belongsToMany(Genre, { through: MovieGenre, foreignKey: "movie_id" });
Genre.belongsToMany(Movie, { through: MovieGenre, foreignKey: "genre_id" });

MovieGenre.belongsTo(Movie, { foreignKey: "movie_id", onDelete: "CASCADE" });
MovieGenre.belongsTo(Genre, { foreignKey: "genre_id", onDelete: "CASCADE" });

Movie.hasMany(MovieGenre, { foreignKey: "movie_id" });
Genre.hasMany(MovieGenre, { foreignKey: "genre_id" });

Showtime.belongsTo(Movie, { foreignKey: "movie_id", onDelete: "CASCADE" });
Movie.hasMany(Showtime, { foreignKey: "movie_id" });

Showtime.belongsTo(Room, { foreignKey: "room_id", onDelete: "CASCADE" });
Room.hasMany(Showtime, { foreignKey: "room_id" });

Seat.belongsTo(SeatType, { foreignKey: "type_id" });
SeatType.hasMany(Seat, { foreignKey: "type_id" });

Seat.belongsTo(Room, { foreignKey: "room_id", onDelete: "CASCADE" });
Room.hasMany(Seat, { foreignKey: "room_id" });

SeatStatus.belongsTo(Seat, { foreignKey: "seat_id", onDelete: "CASCADE" });
Seat.hasMany(SeatStatus, { foreignKey: "seat_id" });

SeatStatus.belongsTo(Showtime, {
  foreignKey: "showtime_id",
  onDelete: "CASCADE",
});
Showtime.hasMany(SeatStatus, { foreignKey: "showtime_id" });

SeatStatus.belongsTo(User, { foreignKey: "user_id", onDelete: "SET NULL" });
User.hasMany(SeatStatus, { foreignKey: "user_id" });

BlockSeat.belongsTo(Seat, { foreignKey: "seat_id", onDelete: "CASCADE" });
Seat.hasMany(BlockSeat, { foreignKey: "seat_id" });

BlockSeat.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(BlockSeat, { foreignKey: "user_id" });

BlockSeat.belongsTo(Showtime, {
  foreignKey: "showtime_id",
  onDelete: "CASCADE",
});
Showtime.hasMany(BlockSeat, { foreignKey: "showtime_id" });

Ticket.belongsTo(Seat, { foreignKey: "seat_id", onDelete: "CASCADE" });
Seat.hasMany(Ticket, { foreignKey: "seat_id" });


Review.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Review, { foreignKey: "user_id" });

Review.belongsTo(Movie, { foreignKey: "movie_id" });
Movie.hasMany(Review, { foreignKey: "movie_id" });

ComboItem.belongsTo(Combo, { foreignKey: "combo_id" });
Combo.hasMany(ComboItem, { foreignKey: "combo_id" });

ComboItem.belongsTo(FoodAndDrink, { foreignKey: "product_id" });
FoodAndDrink.hasMany(ComboItem, { foreignKey: "product_id" });

Order.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Order, { foreignKey: "user_id" });


// Thêm mối quan hệ giữa User và ChatHistory
User.hasMany(ChatHistory, { foreignKey: 'userId' });
ChatHistory.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  Sequelize,
  ...models,
};
