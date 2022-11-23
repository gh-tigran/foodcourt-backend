import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import Categories from "./Categories";
import path from "path";

class Products extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);

    static getOrderTypes = () => [
        {orderBy: 'updatedAt', type: 'ASC', desc: 'old-new'},
        {orderBy: 'updatedAt', type: 'DESC', desc: 'new-old'},
        {orderBy: 'price', type: 'ASC', desc: 'cheap-expensive'},
        {orderBy: 'price', type: 'DESC', desc: 'expensive-cheap'},
    ];
}

Products.init({
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
    modelName: 'products',
    tableName: 'products'
});

Products.belongsTo(Categories, {
    foreignKey: 'categoryId',
    as: 'category',
    onUpdate: 'cascade',
    onDelete: 'cascade'
});

Categories.hasMany(Products, {
    foreignKey: 'categoryId',
    as: 'products',
    onUpdate: 'cascade',
    onDelete: 'cascade'
});

export default Products;