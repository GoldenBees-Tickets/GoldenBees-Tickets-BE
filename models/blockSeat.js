module.exports = (sequelize, DataTypes) => {
    const BlockSeat = sequelize.define(
        "BlockSeat",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            seat_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            showtime_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            blocked_at: {
                type: DataTypes.DATE,  
                allowNull: true,
                defaultValue: DataTypes.NOW, 
            },
            expires_at: {
                type: DataTypes.DATE, 
                allowNull: false,
            },
        },
        {
            timestamps: false,
            tableName: 'blockseats', // Đảm bảo tên bảng khớp với MySQL
            freezeTableName: true 
        }
    );

    return BlockSeat;
};
