import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface WaterLogAttributes {
  id: string;
  user_id: string;
  amount: number; // in ml
  logged_date: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WaterLogCreationAttributes extends Optional<WaterLogAttributes, 'id' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class WaterLog extends Model<WaterLogAttributes, WaterLogCreationAttributes> implements WaterLogAttributes {
  public id!: string;
  public user_id!: string;
  public amount!: number;
  public logged_date!: Date;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WaterLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5000, // Max 5L per entry
      },
    },
    logged_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },
  },
  {
    sequelize,
    modelName: 'WaterLog',
    tableName: 'water_logs',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['logged_date'],
      },
      {
        fields: ['user_id', 'logged_date'],
      },
    ],
  }
);