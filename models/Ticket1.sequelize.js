module.exports = (sequelize, DataTypes) => {
  const Ticket1 = sequelize.define(
    "Ticket1",
    {
      movieName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      showTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      seat: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'used', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',  // Tham chiếu đến bảng User
          key: 'id',       // Khóa chính trong bảng User
        },
      },
    },
    {
      timestamps: true,  // Tự động quản lý `createdAt` và `updatedAt`
      paranoid: false,   // Không sử dụng xóa mềm với `deletedAt`
      tableName: 'ticket1s',  // Tên bảng trong cơ sở dữ liệu
    }
  );

  // Định nghĩa mối quan hệ với bảng User
  Ticket1.associate = (models) => {
    Ticket1.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Ticket1;
}; 