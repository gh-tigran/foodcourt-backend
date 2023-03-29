import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";

class Comment extends Model {

}

Comment.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    comment: {
        type: DataTypes.STRING(3000),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('активный', 'ожидающий', 'заблокированный'),
        allowNull: false,
        defaultValue: 'ожидающий'
    },
}, {
    sequelize,
    modelName: 'comment',
    tableName: 'comment'
});

export default Comment;
