module.exports = (sequelize, DataTypes) => {
    const Seat = sequelize.define(
        "Seat",
        {
            room_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                onDelete: 'CASCADE', 
            },
            seat_number: {
                type: DataTypes.STRING(10),
                allowNull: false,
            },
            seat_row: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            is_enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            type_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            }
        },
        {
            timestamps: true, 
            paranoid: true, 
        }
    );

    return Seat;
};
