import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";

class Offers extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);
}

Offers.init({
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
    title: {
        type: DataTypes.TEXT(),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
    },
    price: {
        type: DataTypes.INTEGER(),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'offers',
    tableName: 'offers'
});

export default Offers;