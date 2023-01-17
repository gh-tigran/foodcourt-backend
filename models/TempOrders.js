import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import Map from "./Map";
import Users from "./Users";

class TempOrders extends Model {

}

TempOrders.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    userId:{
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    branchId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    receiveType: {
        type: DataTypes.ENUM('cashOnDelivery', 'cardOnDelivery', 'onBranch', 'cardOnBranch'),
        allowNull: false,
        defaultValue: 'onBranch',
    },
    status: {
        type: DataTypes.ENUM('pending', 'inProcess', 'ready', 'onTheWay', 'received'),
        allowNull: false,
        defaultValue: 'pending',
    },
    address: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    message: {
        type: DataTypes.STRING(3000),
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'tempOrders',
    tableName: 'tempOrders'
});

Map.hasMany(TempOrders, {
    foreignKey: 'branchId',
    as: 'tempOrders',
    onDelete: 'cascade',
    onUpdate: 'cascade',
});

TempOrders.belongsTo(Map, {
    foreignKey: 'branchId',
    as: 'branch',
    onDelete: 'cascade',
    onUpdate: 'cascade',
});

TempOrders.belongsTo(Users, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'cascade',
    onUpdate: 'cascade',
});

Users.hasMany(TempOrders, {
    foreignKey: 'userId',
    as: 'tempOrders',
    onDelete: 'cascade',
    onUpdate: 'cascade',
});

export default TempOrders;
