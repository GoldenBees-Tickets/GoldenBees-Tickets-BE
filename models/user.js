
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
      "User",
      {
        username: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM('admin', 'branch_admin', 'user'),
          defaultValue: "user",
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        branch_id: {
          type: DataTypes.INTEGER,
          defaultValue: null, 
        },
        image: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null, 
        },
        status: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        phone: {
          type: DataTypes.STRING,
          defaultValue: null,
        },
        star: {
          type: DataTypes.NUMBER,
          defaultValue: 0,
        }
      },
      {
        timestamps: true,
      }
    );

    return User;
  };
  