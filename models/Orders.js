import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import Products from "./Products";

class Orders extends Model {

}

Orders.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    productId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER(100).UNSIGNED,
        allowNull: false,
        defaultValue: 1
    },
}, {
    sequelize,
    modelName: 'orders',
    tableName: 'orders'
});

Products.hasMany(Orders, {
    foreignKey: 'productId',
    as: 'orders',
    onDelete: 'cascade',
    onUpdate: 'cascade',
});

Orders.belongsTo(Products, {
    foreignKey: 'productId',
    as: 'product',
    onDelete: 'cascade',
    onUpdate: 'cascade',
});

export default Orders;
