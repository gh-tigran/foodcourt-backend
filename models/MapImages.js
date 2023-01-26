import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import Map from "./Map";

class MapImages extends Model {

}

MapImages.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    size: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'mapImages',
    tableName: 'mapImages'
});

MapImages.belongsTo(Map, {
    foreignKey: 'branchId',
    as: 'branch',
    onUpdate: 'cascade',
    onDelete: 'cascade'
});

Map.hasMany(MapImages, {
    foreignKey: 'branchId',
    as: 'images',
    onUpdate: 'cascade',
    onDelete: 'cascade'
});

export default MapImages;
