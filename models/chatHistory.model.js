module.exports = (sequelize, DataTypes) => {
    const ChatHistory = sequelize.define(
        "ChatHistory",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            text: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            sender: {
                type: DataTypes.ENUM('user', 'ai'),
                allowNull: false
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        {
            tableName: 'chat_histories',
            timestamps: true,
            paranoid: true
        }
    );

    // Định nghĩa mối quan hệ với bảng User
    ChatHistory.associate = (models) => {
        ChatHistory.belongsTo(models.User, {
            foreignKey: 'userId',
        });
    };

    return ChatHistory;
}; 