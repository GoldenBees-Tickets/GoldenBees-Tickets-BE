module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define(
        "Post",
        {
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            content: {
                type: DataTypes.TEXT('long'),
                allowNull: false,
            },
            thumbnail: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('active', 'draft', 'inactive'),
                defaultValue: 'active',
                allowNull: false,
            },
            author: {
                type: DataTypes.STRING(255),
                defaultValue: 'Admin',
                allowNull: false,
            },
        },
        {
            tableName: "posts",
            timestamps: true,
            paranoid: false,
        }
    );

    return Post;
}; 