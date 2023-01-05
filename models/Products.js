import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";
import slug from "slug";

class Products extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);

    static getOrderTypes = () => [
        {orderBy: 'createdAt', type: 'ASC', desc: 'old-new'},
        {orderBy: 'createdAt', type: 'DESC', desc: 'new-old'},
        {orderBy: 'price', type: 'ASC', desc: 'cheap-expensive'},
        {orderBy: 'price', type: 'DESC', desc: 'expensive-cheap'},
    ];

    static generateSlug = async (title) => {
        let slugName = slug(title);

        const sameSlugNameOffers = await Products.findAll({where: {slugName}});

        if(sameSlugNameOffers.length){
            return '-';
        }

        return slugName;
    }
}

Products.init({
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
    },
    type: {
        type: DataTypes.ENUM('offer', 'product'),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'products',
    tableName: 'products'
});

// Products.belongsTo(Categories, {
//     foreignKey: 'categoryId',
//     as: 'category',
//     onUpdate: 'cascade',
//     onDelete: 'cascade'
// });
//
// Categories.hasMany(Products, {
//     foreignKey: 'categoryId',
//     as: 'products',
//     onUpdate: 'cascade',
//     onDelete: 'cascade'
// });

export default Products;
