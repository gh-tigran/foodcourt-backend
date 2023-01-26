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
    title: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    country: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    phoneNum: {
        type: DataTypes.STRING(),
        allowNull: false,
        validate: {
            validator: function(v) {
                return /^\d{11,25}$/.test(v);
            },
        }
    },
    main: {
        type: DataTypes.ENUM('main', 'not main'),
        allowNull: false,
        defaultValue: 'not main'
    },
}, {
    sequelize,
    modelName: 'map',
    tableName: 'map'
});

export default Map;
