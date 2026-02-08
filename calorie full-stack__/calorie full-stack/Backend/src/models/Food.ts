import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface FoodAttributes {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  serving_size?: number;
  serving_unit?: string;
  source: 'user' | 'database' | 'api';
   // external_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FoodCreationAttributes extends Optional<FoodAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Food extends Model<FoodAttributes, FoodCreationAttributes> implements FoodAttributes {
  public id!: string;
  public name!: string;
  public calories_per_100g!: number;
  public protein_per_100g!: number;
  public carbs_per_100g!: number;
  public fats_per_100g!: number;
  public serving_size?: number;
  public serving_unit?: string;
  public source!: 'user' | 'database' | 'api';
  // public  // external_id?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Food.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    calories_per_100g: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 9000,
      },
    },
    protein_per_100g: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    carbs_per_100g: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    fats_per_100g: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    source: {
      type: DataTypes.ENUM('user', 'database', 'api'),
      allowNull: false,
      defaultValue: 'database',
    },
    serving_size: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0.1,
        max: 10000,
      },
    },
    serving_unit: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 20],
      },
    },
    //  external_id: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
  },
  {
    sequelize,
    modelName: 'Food',
    tableName: 'foods',
    timestamps: true,
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['source'],
      },
      // {
      //   fields: [' // external_id'],
      // },
    ],
  }
);