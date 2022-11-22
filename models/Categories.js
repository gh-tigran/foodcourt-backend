import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";

class Categories extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);
}

Categories.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    imagePath: {
        type: DataTypes.TEXT(),
        allowNull: false,
    },
    name: {
        type: DataTypes.TEXT(),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'categories',
    tableName: 'categories'
});

export default Categories;