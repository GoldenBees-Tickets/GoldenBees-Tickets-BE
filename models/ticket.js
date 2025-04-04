module.exports = (sequelize, DataTypes) => {
    const Ticket = sequelize.define(
        "Ticket",
        {
            order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                onDelete: 'CASCADE',
            },
            seat_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                onDelete: 'CASCADE', // Nếu ghế bị xóa, vé cũng bị xóa
            },
            price: {
                type: DataTypes.DECIMAL(10, 0),
                allowNull: false, 
            },
        },
        {
            timestamps: false,
            paranoid: false,   
        }
    );

    return Ticket;
};
