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
            },
            start_time: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            end_time: {
                type: DataTypes.DATE,
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
            timestamps: true,  
            paranoid: true,  
        }
    );

    return Showtime;
};
