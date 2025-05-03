module.exports = (sequelize, DataTypes) => {
    const Showtime = sequelize.define(
        "Showtime",
        {
            room_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                onDelete: 'CASCADE', 
            },
            movie_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                onDelete: 'CASCADE',
                references: {
                    model: 'Movie',
                    key: 'id'
                },
            },
            show_date: {
                type: DataTypes.DATEONLY, // Chỉ ngày (yyyy-mm-dd)
                allowNull: false,
            },
            start_time: {
                type: DataTypes.TIME, // Chỉ giờ (HH:mm:ss)
                allowNull: false,
            },
            end_time: {
                type: DataTypes.TIME, // Chỉ giờ (HH:mm:ss)
                allowNull: false,
            },
            base_price: {
                type: DataTypes.DECIMAL(10, 0),
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('active', 'cancelled'),
                defaultValue: 'active',
                allowNull: false,
            },
        },
        {
            tableName: 'showtimes', 
            timestamps: true,
            paranoid: true,
        }
    );

    return Showtime;
};
