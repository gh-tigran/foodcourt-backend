import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import path from "path";

class FooterSocial extends Model {
    static getImgPath = (filePath) => path.join(__dirname, '../public/', filePath);
}

FooterSocial.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    imagePath: {
        type: DataTypes.STRING(3000),
        allowNull: false,
    },
    link: {
        type: DataTypes.STRING(3000),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'footerSocial',
    tableName: 'footerSocial'
});

export default FooterSocial;
