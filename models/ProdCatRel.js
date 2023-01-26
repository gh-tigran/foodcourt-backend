import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import Categories from "./Categories";
import Products from "./Products";

class ProdCatRel extends Model {

}

ProdCatRel.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    productId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        onUpdate: 'cascade',
        onDelete: 'set null',
    },
    categoryId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        onUpdate: 'cascade',
        onDelete: 'set null',
    }
}, {
    sequelize,
    modelName: 'prodCatRel',
    tableName: 'prodCatRel'
});

Categories.belongsToMany(Products, {
    through: "prodCatRel",
    foreignKey: 'categoryId',
    as: 'products',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
});
Products.belongsToMany(Categories, {
    through: "prodCatRel",
    foreignKey: 'productId',
    as: 'categories',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
});

export default ProdCatRel;
