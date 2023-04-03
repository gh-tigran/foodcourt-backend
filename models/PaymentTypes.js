import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import TempOrders from "./TempOrders";

class PaymentTypes extends Model {

}

PaymentTypes.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    typeName: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    allowUse: {
        type: DataTypes.ENUM('t', 'f'),
        allowNull: false,
        defaultValue: 't',
    }
}, {
    sequelize,
    modelName: 'paymentTypes',
    tableName: 'paymentTypes'
});

TempOrders.belongsTo(PaymentTypes, {
    foreignKey: 'paymentTypeId',
    as: 'paymentType',
    onDelete: 'set null',
    onUpdate: 'cascade',
});

PaymentTypes.hasMany(TempOrders, {
    foreignKey: 'paymentTypeId',
    as: 'tempOrders',
    onDelete: 'set null',
    onUpdate: 'cascade',
});

export default PaymentTypes;
