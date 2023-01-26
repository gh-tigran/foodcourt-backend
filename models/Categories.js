import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";
import slug from "slug";

class Categories extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);

    static generateSlug = async (name) => {
        let slugName = slug(name);

        const sameSlugNameCategories = await Categories.findAll({where: {slugName}});

        if(sameSlugNameCategories.length) return '-';

        return slugName;
    };
}

Categories.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    imagePath: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    slugName: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: 'slugName'
    },
}, {
    sequelize,
    modelName: 'categories',
    tableName: 'categories'
});

export default Categories;
