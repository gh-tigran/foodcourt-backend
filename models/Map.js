import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";
import slug from "slug";

class Map extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);

    static generateSlug = async (title) => {
        let slugName = slug(title);

        const sameSlugNameMaps = await Map.findAll({where: {slugName}});

        if(sameSlugNameMaps.length){
            return '-';
        }

        return slugName;
    }
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
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    country: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING(),
        allowNull: false,
        validate: {
            validator: function(v) {
                return /^\d{11,}$/.test(v);
            },
        }
    },
    main: {
        type: DataTypes.ENUM('main', 'not main'),
        allowNull: false,
        defaultValue: 'not main'
    },
    slugName: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: 'slugName',
    },
}, {
    sequelize,
    modelName: 'map',
    tableName: 'map'
});

export default Map;
