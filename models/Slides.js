import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";

class Slides extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);
}

Slides.init({
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
    src: {
        type: DataTypes.TEXT(),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'slides',
    tableName: 'slides'
});

export default Slides;