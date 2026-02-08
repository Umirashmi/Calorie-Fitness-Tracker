import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface GoalAttributes {
  id: string;
  user_id: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GoalCreationAttributes extends Optional<GoalAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Goal extends Model<GoalAttributes, GoalCreationAttributes> implements GoalAttributes {
  public id!: string;
  public user_id!: string;
  public daily_calories!: number;
  public daily_protein!: number;
  public daily_carbs!: number;
  public daily_fats!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Goal.init(
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
    daily_calories: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 800,
        max: 10000,
      },
    },
    daily_protein: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1000,
      },
    },
    daily_carbs: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 2000,
      },
    },
    daily_fats: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 500,
      },
    },
  },
  {
    sequelize,
    modelName: 'Goal',
    tableName: 'goals',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
    ],
  }
);