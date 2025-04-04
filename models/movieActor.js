

module.exports = (sequelize, DataTypes) => {
    const MovieActor = sequelize.define(
        "MovieActor",
        {
            movie_id: {
                type: DataTypes.INTEGER,
                allowNull: false, 
                primaryKey: true, 
                onDelete: "CASCADE",  
            },
            actor_id: {
                type: DataTypes.INTEGER,
                allowNull: false,  
                primaryKey: true,  
                onDelete: "CASCADE", 
            },
        },
        {
            tableName: "movie_actors",
            timestamps: true,
            paranoid: false,    
        }
    );


    return MovieActor;
};
