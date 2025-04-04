
module.exports = (sequelize, DataTypes) => {
    const Room = sequelize.define(
        "Room",
        {
            name: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            cinema_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            rows_count: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            columns_count: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
        },
        {
            timestamps: true, 
            paranoid: true,   
        }
    );

    return Room;
};
