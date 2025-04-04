module.exports = (sequelize, DataTypes) => {
    const SeatStatus = sequelize.define(
        "SeatStatus",
        {
            seat_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                onDelete: 'CASCADE', 
            },
            showtime_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                onDelete: 'CASCADE',
            },
            status: {
                type: DataTypes.ENUM('Available', 'Blocked', 'Booked'),
                defaultValue: 'Available',
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                onDelete: 'SET NULL',
            },
        },
        {
            timestamps: true, 
            paranoid: true,    
        }
    );

    return SeatStatus;
};
