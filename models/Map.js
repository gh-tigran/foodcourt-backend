import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";

class Map extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);
}

Map.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    x:{
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    y:{
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    fullCoords:{
        type: DataTypes.TEXT(),
        allowNull: false,
        //unique: "fullCoords"
    },
    title: {
        type: DataTypes.TEXT(),
        allowNull: false,
    },
    location: {
        type: DataTypes.TEXT(),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'map',
    tableName: 'map'
});

export default Map;
