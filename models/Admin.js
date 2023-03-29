import {DataTypes, Model} from "sequelize";
import sequelize from "../services/sequelize";
import md5 from "md5";
import Branches from "./Branches";

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
    branchId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        onUpdate: 'cascade',
        onDelete: 'set null',
    },
    status: {
        type: DataTypes.ENUM('active', 'pending', 'deleted'),
        allowNull: false,
        defaultValue: 'pending'
    },
    role: {
        type: DataTypes.ENUM('владелец', 'супер админ', 'админ'),
        allowNull: false,
        defaultValue: 'админ',
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

Branches.hasMany(Admin, {
    foreignKey: 'branchId',
    as: 'admins',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
});

Admin.belongsTo(Branches, {
    foreignKey: 'branchId',
    as: 'branch',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
});

export default Admin;
