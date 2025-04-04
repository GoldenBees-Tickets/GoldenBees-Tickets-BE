

module.exports = (sequelize, DataTypes) => {
    const MovieGenre = sequelize.define(
        "MovieGenre",
        {
            movie_id: {
                type: DataTypes.INTEGER,
                allowNull: false, 
                primaryKey: true,  
            },
            genre_id: {
                type: DataTypes.INTEGER,
                allowNull: false,  
                primaryKey: true,  
            },
        },
        {
            tableName: "movie_genres",
            timestamps: true,
            paranoid: false,    
        }
    );


    return MovieGenre;
};
