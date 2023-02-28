import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import Branches from "./Branches";

class BranchImages extends Model {

}

BranchImages.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    size: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'mapImages',
    tableName: 'mapImages'
});

BranchImages.belongsTo(Branches, {
    foreignKey: 'branchId',
    as: 'branch',
    onUpdate: 'cascade',
    onDelete: 'cascade'
});

Branches.hasMany(BranchImages, {
    foreignKey: 'branchId',
    as: 'images',
    onUpdate: 'cascade',
    onDelete: 'cascade'
});

export default BranchImages;
