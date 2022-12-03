import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import md5 from "md5";

const {PASSWORD_SECRET} = process.env;

class Admin extends Model {
    static passwordHash = (val) => md5(md5(val) + PASSWORD_SECRET);
}

Admin.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(50),
        unique: 'email',
        allowNull: false,
    },
    phoneNum: {
        type: DataTypes.STRING(25),
        allowNull: false,
    },
    password: {
        type: DataTypes.CHAR(32),
        allowNull: false,
        set(val) {
            if (val) {
                this.setDataValue('password', Users.passwordHash(val))
            }
        },
        get() {
            return undefined;
        }
    }
}, {
    sequelize,
    modelName: 'admin',
    tableName: 'admin'
});

export default Admin;
