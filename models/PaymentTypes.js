import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";

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
}, {
    sequelize,
    modelName: 'paymentTypes',
    tableName: 'paymentTypes'
});

export default PaymentTypes;
