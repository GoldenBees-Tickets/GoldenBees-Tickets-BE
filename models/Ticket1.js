module.exports = (sequelize, DataTypes) => {
  const Ticket1 = sequelize.define('Ticket1', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    movieName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    showTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    seat: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'used', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'ticket1s',
    timestamps: false  // Không sử dụng createdAt và updatedAt vì không có trong bảng database
  });

  return Ticket1;
}; 