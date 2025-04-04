module.exports = (sequelize, DataTypes) => {
    const Cinema = sequelize.define(
      "Cinema",
      {
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        city: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        district: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        ward: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        street: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        branch_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        timestamps: true,
        paranoid: true, // Enable `deletedAt` column
      }
    );
    return Cinema;
  };
  