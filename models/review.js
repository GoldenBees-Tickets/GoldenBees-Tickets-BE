module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define(
        "Review",
        {
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            movie_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            rating: {
                type: DataTypes.FLOAT,
                allowNull: false,
                validate: {
                    min: 0.5,  // Rating phải từ 1
                    max: 5,  // Rating phải không vượt quá 5
                },
            },
        },
        {
            timestamps: true,  
            paranoid: false,   
            indexes: [
                {
                    unique: true,
                    fields: ['user_id', 'movie_id'],
                },
            ],
        }
    );

    return Review;
};
