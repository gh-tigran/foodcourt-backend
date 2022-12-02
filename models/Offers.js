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
    price: {
        type: DataTypes.INTEGER(),
        allowNull: false,
    },
    slugName: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: 'slugName',
    }
}, {
    sequelize,
    modelName: 'offers',
    tableName: 'offers'
});

export default Offers;
