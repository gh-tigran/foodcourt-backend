import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import Products from "./Products";

class Basket extends Model {

}

Basket.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    productId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER(100).UNSIGNED,
        allowNull: false,
    }
}, {
    sequelize,
    modelName: 'basket',
    tableName: 'basket'
});

Basket.belongsTo(Products, {
    foreignKey: 'productId',
    as: 'product',
    onUpdate: 'cascade',
    onDelete: 'cascade'
});

Products.hasOne(Basket, {
    foreignKey: 'productId',
    as: 'basket',
    onUpdate: 'cascade',
    onDelete: 'cascade'
});

export default Basket;
