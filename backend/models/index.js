// models/index.js
const {
  sequelize,
  User,
  Exercise,
  Favorite,
  Save,
  Rating,
} = require('./models.js');

module.exports = {
  sequelize,
  User,
  Exercise,
  Favorite,
  Save,
  Rating,
};
