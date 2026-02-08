import { User } from './User';
import { Goal } from './Goal';
import { Food } from './Food';
import { FoodLog } from './FoodLog';
import { WaterLog } from './WaterLog';
import { UserFavoriteFood } from './UserFavoriteFood';

User.hasMany(Goal, {
  foreignKey: 'user_id',
  as: 'goals',
  onDelete: 'CASCADE',
});

Goal.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(FoodLog, {
  foreignKey: 'user_id',
  as: 'foodLogs',
  onDelete: 'CASCADE',
});

FoodLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Food.hasMany(FoodLog, {
  foreignKey: 'food_id',
  as: 'foodLogs',
  onDelete: 'CASCADE',
});

FoodLog.belongsTo(Food, {
  foreignKey: 'food_id',
  as: 'food',
});

User.hasMany(WaterLog, {
  foreignKey: 'user_id',
  as: 'waterLogs',
  onDelete: 'CASCADE',
});

WaterLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.belongsToMany(Food, {
  through: UserFavoriteFood,
  foreignKey: 'user_id',
  otherKey: 'food_id',
  as: 'favoriteFoods',
});

Food.belongsToMany(User, {
  through: UserFavoriteFood,
  foreignKey: 'food_id',
  otherKey: 'user_id',
  as: 'favoritedByUsers',
});

UserFavoriteFood.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

UserFavoriteFood.belongsTo(Food, {
  foreignKey: 'food_id',
  as: 'food',
});

export { User, Goal, Food, FoodLog, WaterLog, UserFavoriteFood };

export const initializeModels = async () => {
  await User.sync();
  await Food.sync();
  await Goal.sync();
  await FoodLog.sync();
  await WaterLog.sync();
  await UserFavoriteFood.sync();
};