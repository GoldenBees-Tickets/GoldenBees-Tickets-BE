module.exports = (sequelize, DataTypes) => {
    const MovieProducer = sequelize.define(
        "MovieProducer",
        {
            movie_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                onDelete: "CASCADE", 
            },
            producer_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                onDelete: "CASCADE", 
            },
        },
        {
            timestamps: true,  // Tự động quản lý `createdAt` và `updatedAt`
            tableName: "movie_producers", // Đặt tên bảng
        }
    );

    return MovieProducer;
};
