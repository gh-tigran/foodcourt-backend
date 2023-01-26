import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";
import slug from "slug";

class News extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);

    static generateSlug = async (title) => {
        let slugName = slug(title);

        const sameSlugNameNews = await News.findAll({where: {slugName}});

        if(sameSlugNameNews.length){
            return '-';
        }

        return slugName;
    }
}

News.init({
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
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(3000),
        allowNull: false,
    },
    slugName: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: 'slugName',
    },
}, {
    sequelize,
    modelName: 'news',
    tableName: 'news'
});

export default News;
