import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import FooterSocial from './FooterSocial';

class Footer extends Model {

}

Footer.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    copyright: {
        type: DataTypes.STRING(3000),
        allowNull: false
    },
    socialMediaTitle: {
        type: DataTypes.STRING(3000),
        allowNull: true
    },
}, {
    sequelize,
    modelName: 'footer',
    tableName: 'footer'
});

Footer.hasMany(FooterSocial, {
    foreignKey: 'footerId',
    as: 'social',
    onDelete: 'NO ACTION',
    onUpdate: 'cascade',
});

FooterSocial.belongsTo(Footer, {
    foreignKey: 'footerId',
    as: 'footer',
    onDelete: 'NO ACTION',
    onUpdate: 'cascade',
});

export default Footer;
