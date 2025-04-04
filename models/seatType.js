module.exports = (sequelize, DataTypes) => {
    const SeatType = sequelize.define(
        "SeatType",
        {
            type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            color: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            price_offset: {
                type: DataTypes.DECIMAL(10,0),
                defaultValue: 0,
                allowNull: false,
            }
        },
        {
            tableName: "seat_types",
            timestamps: true, 
            paranoid: true,    
        }
    );

    return SeatType;
};
