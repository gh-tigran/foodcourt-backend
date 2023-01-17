import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import Orders from "./Orders";
import TempOrders from "./TempOrders";

class OrderRel extends Model {

}

OrderRel.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    tempOrderId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        onUpdate: 'cascade',
        onDelete: 'set null'
    },
    orderId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        onUpdate: 'cascade',
        onDelete: 'set null'
    },
}, {
    sequelize,
    modelName: 'orderRel',
    tableName: 'orderRel'
});

Orders.belongsToMany(TempOrders, {
    through: "orderRel",
    foreignKey: 'orderId',
    as: 'tempOrders',
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
});
TempOrders.belongsToMany(Orders, {
    through: "orderRel",
    foreignKey: 'tempOrderId',
    as: 'orders',
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
});

export default OrderRel;
