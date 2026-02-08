import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserFavoriteFoodAttributes {
  id: string;
  user_id: string;
  food_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserFavoriteFoodCreationAttributes extends Optional<UserFavoriteFoodAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class UserFavoriteFood extends Model<UserFavoriteFoodAttributes, UserFavoriteFoodCreationAttributes> implements UserFavoriteFoodAttributes {
  public id!: string;
  public user_id!: string;
  public food_id!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserFavoriteFood.init(
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
  },
  {
    sequelize,
    modelName: 'UserFavoriteFood',
    tableName: 'user_favorite_foods',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'food_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['food_id'],
      },
    ],
  }
);