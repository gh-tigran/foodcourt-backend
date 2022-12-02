import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";

class News extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);
}

News.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    imagePath: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(3000),
        allowNull: false,
    },
    slugName: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: 'slugName',
    },
}, {
    sequelize,
    modelName: 'news',
    tableName: 'news'
});

export default News;
