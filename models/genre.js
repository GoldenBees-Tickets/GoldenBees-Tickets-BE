module.exports = (sequelize, DataTypes) => {
    const Genre = sequelize.define(
        "Genre",
        {
            name: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
        },
        {
            timestamps: true, // Automatically manages `createdAt` and `updatedAt`
            paranoid: true, // Enables `deletedAt` column for soft deletes
        }
    );

    return Genre;
};
