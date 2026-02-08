import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CalculatedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface FoodLogAttributes {
  id: string;
  user_id: string;
  food_id: string;
  portion_size: number;
  quantity: number;
  calculated_macros: CalculatedMacros;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FoodLogCreationAttributes extends Optional<FoodLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class FoodLog extends Model<FoodLogAttributes, FoodLogCreationAttributes> implements FoodLogAttributes {
  public id!: string;
  public user_id!: string;
  public food_id!: string;
  public portion_size!: number;
  public quantity!: number;
  public calculated_macros!: CalculatedMacros;
  public meal_type!: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  public logged_date!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FoodLog.init(
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
    food_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'foods',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    portion_size: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0.1,
        max: 10000,
      },
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0.1,
        max: 10000,
      },
    },
    calculated_macros: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidMacros(value: any) {
          if (!value || typeof value !== 'object') {
            throw new Error('Calculated macros must be an object');
          }
          const required = ['calories', 'protein', 'carbs', 'fats'];
          for (const field of required) {
            if (typeof value[field] !== 'number' || value[field] < 0) {
              throw new Error(`${field} must be a non-negative number`);
            }
          }
        },
      },
    },
    meal_type: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
      allowNull: false,
    },
    logged_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'FoodLog',
    tableName: 'food_logs',
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
      {
        fields: ['meal_type'],
      },
    ],
  }
);