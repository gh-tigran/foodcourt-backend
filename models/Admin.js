import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import md5 from "md5";

const {PASSWORD_SECRET} = process.env;

class Admin extends Model {
    static passwordHash = (val) => md5(md5(val) + PASSWORD_SECRET);

    static activate = async (email) => {
        await Admin.update({
            status: 'active',
            confirmToken: null,
        }, {where: {email, status: 'pending'}});
    };
}

Admin.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(80),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(80),
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
    status: {
        type: DataTypes.ENUM('active', 'pending', 'deleted'),
        allowNull: false,
        defaultValue: 'pending'
    },
    possibility: {
        type: DataTypes.ENUM('junior', 'middle', 'senior'),
        allowNull: false,
        defaultValue: 'junior'
    },
    confirmToken: {
        type: DataTypes.STRING(80),
        allowNull: true
    },
    password: {
        type: DataTypes.CHAR(32),
        allowNull: false,
        set(val) {
            if (val) {
                this.setDataValue('password', Admin.passwordHash(val))
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
