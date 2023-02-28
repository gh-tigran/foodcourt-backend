import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import md5 from "md5";

const {PASSWORD_SECRET} = process.env;

class Users extends Model {
    static passwordHash = (val) => md5(md5(val) + PASSWORD_SECRET);

    static activate = async (email) => {
        await Users.update({
            status: 'active',
            confirmToken: null,
            email
        }, {where: {email, status: 'pending'}});
    };
}

Users.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        unique: 'email',
        allowNull: false,
    },
    phoneNum: {
        type: DataTypes.STRING(),
        allowNull: false,
        validate: {
            validator: function(v) {
                return /^\d{11,25}$/.test(v);
            },
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'pending', 'deleted', 'blocked'),
        allowNull: false,
        defaultValue: 'pending'
    },
    confirmToken: {
        type: DataTypes.STRING(100),
        allowNull: true
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
    modelName: 'users',
    tableName: 'users'
});

export default Users;
