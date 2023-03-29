import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";

class About extends Model {

}

About.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(1000),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(3000),
        allowNull: false
    },
}, {
    sequelize,
    modelName: 'about',
    tableName: 'about'
});

export default About;
