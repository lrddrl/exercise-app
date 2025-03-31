const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

class User extends Model {}
User.init({
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
}, { sequelize, modelName: 'user' });

class Exercise extends Model {}
Exercise.init({
  name: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  difficulty: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  isPublic: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, modelName: 'exercise' });

class Favorite extends Model {}
Favorite.init({}, { sequelize, modelName: 'favorite' });

class Save extends Model {}
Save.init({}, { sequelize, modelName: 'save' });

class Rating extends Model {}
Rating.init({
  score: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
}, { sequelize, modelName: 'rating' });

User.hasMany(Exercise, { foreignKey: 'userId' });
Exercise.belongsTo(User, { foreignKey: 'userId' });

User.belongsToMany(Exercise, { through: Favorite, as: 'FavoritedExercises' });
Exercise.belongsToMany(User, { through: Favorite, as: 'FavoritedBy' });

User.belongsToMany(Exercise, { through: Save, as: 'SavedExercises' });
Exercise.belongsToMany(User, { through: Save, as: 'SavedBy' });

// Explicit associations for join tables
Favorite.belongsTo(User, { foreignKey: 'userId' });
Favorite.belongsTo(Exercise, { foreignKey: 'exerciseId' });

Save.belongsTo(User, { foreignKey: 'userId' });
Save.belongsTo(Exercise, { foreignKey: 'exerciseId' });

User.hasMany(Rating, { foreignKey: 'userId' });
Exercise.hasMany(Rating, { foreignKey: 'exerciseId' });
Rating.belongsTo(User, { foreignKey: 'userId' });
Rating.belongsTo(Exercise, { foreignKey: 'exerciseId' });

module.exports = {
  sequelize,
  User,
  Exercise,
  Favorite,
  Save,
  Rating,
};
