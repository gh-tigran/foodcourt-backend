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
    lat:{
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    lon:{
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    // fullCoords:{
    //     type: DataTypes.TEXT(),
    //     allowNull: false,
    //     //unique: "fullCoords"
    // },
    title: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    slugName: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'map',
    tableName: 'map'
});

export default Map;
