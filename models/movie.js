module.exports = (sequelize, DataTypes) => {
  const Movie = sequelize.define(
    "Movie",
    {
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      trailer: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      poster: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      age_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: "P",
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      director_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      release_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },      
    },
    {
      timestamps: true,
      paranoid: true,
    }
  );

  return Movie;
};
