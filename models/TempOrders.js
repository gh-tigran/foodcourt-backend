import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import Branches from "./Branches";
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
    status: {
        type: DataTypes.ENUM('в ожидании', 'в процессе', 'готовый', 'в пути', 'полученный'),
        allowNull: false,
        defaultValue: 'в ожидании',
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

Branches.hasMany(TempOrders, {
    foreignKey: 'branchId',
    as: 'tempOrders',
    onDelete: 'cascade',
    onUpdate: 'cascade',
});

TempOrders.belongsTo(Branches, {
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
