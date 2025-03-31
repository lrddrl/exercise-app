const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Exercise,
  Favorite,
  Save,
  Rating,
} = require('./models');

const app = express();

app.use(cors({
  origin: 'http://localhost:3001'
}));

app.use(bodyParser.json());

const JWT_SECRET = 'your_jwt_secret';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = await User.findByPk(payload.userId);
    if (!req.user) throw new Error('User not found');
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

app.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash });
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (err) {
    res.status(400).json({ message: 'Error creating user', error: err.message });
  }
});

app.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

app.post('/users/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'No refresh token provided' });
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    const newAccessToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
});

app.post('/exercises', authenticateToken, async (req, res) => {
  const { name, description, difficulty, isPublic } = req.body;
  try {
    const exercise = await Exercise.create({
      name,
      description,
      difficulty,
      isPublic,
      userId: req.user.id,
    });
    res.status(201).json({ message: 'Exercise created', exercise });
  } catch (err) {
    res.status(400).json({ message: 'Error creating exercise', error: err.message });
  }
});

app.put('/exercises/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findByPk(id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    if (exercise.userId !== req.user.id)
      return res.status(403).json({ message: 'Not allowed to update this exercise' });
    await exercise.update(req.body);
    res.json({ message: 'Exercise updated', exercise });
  } catch (err) {
    res.status(400).json({ message: 'Error updating exercise', error: err.message });
  }
});

app.delete('/exercises/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findByPk(id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    if (exercise.userId !== req.user.id)
      return res.status(403).json({ message: 'Not allowed to delete this exercise' });
    await exercise.destroy();
    res.json({ message: 'Exercise deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting exercise', error: err.message });
  }
});

app.get('/exercises', authenticateToken, async (req, res) => {
  const { sortBy, search } = req.query;
  const whereClause = {
    [Op.or]: [
      { isPublic: true },
      { userId: req.user.id }
    ]
  };
  if (search) {
    const likeSearch = { [Op.like]: `%${search}%` };
    whereClause[Op.and] = [{
      [Op.or]: [
        { name: likeSearch },
        { description: likeSearch },
        { difficulty: search }
      ]
    }];
  }
  try {
    const exercises = await Exercise.findAll({
      where: whereClause,
      order: sortBy ? [[sortBy, 'ASC']] : [],
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: User, as: 'FavoritedBy', attributes: ['id'] },
        { model: User, as: 'SavedBy', attributes: ['id'] },
      ],
    });
    const data = exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      description: ex.description,
      difficulty: ex.difficulty,
      isPublic: ex.isPublic,
      favoriteCount: ex.FavoritedBy.length,
      saveCount: ex.SavedBy.length,
    }));
    res.json({ exercises: data });
  } catch (err) {
    res.status(400).json({ message: 'Error fetching exercises', error: err.message });
  }
});

app.get('/exercises/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Rating },
        { model: User, as: 'FavoritedBy', attributes: ['id', 'username'] },
        { model: User, as: 'SavedBy', attributes: ['id', 'username'] },
      ],
    });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    if (!exercise.isPublic && exercise.userId !== req.user.id)
      return res.status(403).json({ message: 'Not allowed to view this exercise' });
    const ratings = exercise.ratings;
    const avgRating = ratings && ratings.length ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1) : null;
    res.json({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      difficulty: exercise.difficulty,
      averageRating: avgRating,
      favoriteCount: exercise.FavoritedBy.length,
      saveCount: exercise.SavedBy.length,
    });
  } catch (err) {
    res.status(400).json({ message: 'Error fetching exercise', error: err.message });
  }
});

app.post('/exercises/:id/favorite', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findByPk(id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    await Favorite.findOrCreate({ where: { userId: req.user.id, exerciseId: id } });
    res.json({ message: 'Exercise favorited' });
  } catch (err) {
    res.status(400).json({ message: 'Error favoriting exercise', error: err.message });
  }
});

app.delete('/exercises/:id/favorite', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const count = await Favorite.destroy({ where: { userId: req.user.id, exerciseId: id } });
    res.json({ message: count ? 'Favorite removed' : 'No favorite found' });
  } catch (err) {
    res.status(400).json({ message: 'Error removing favorite', error: err.message });
  }
});

app.post('/exercises/:id/save', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findByPk(id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    await Save.findOrCreate({ where: { userId: req.user.id, exerciseId: id } });
    res.json({ message: 'Exercise saved' });
  } catch (err) {
    res.status(400).json({ message: 'Error saving exercise', error: err.message });
  }
});

app.delete('/exercises/:id/save', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const count = await Save.destroy({ where: { userId: req.user.id, exerciseId: id } });
    res.json({ message: count ? 'Save removed' : 'No save found' });
  } catch (err) {
    res.status(400).json({ message: 'Error removing save', error: err.message });
  }
});

app.post('/exercises/:id/rate', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  if (!score || score < 1 || score > 5)
    return res.status(400).json({ message: 'Score must be between 1 and 5' });
  try {
    const [rating, created] = await Rating.upsert(
      { userId: req.user.id, exerciseId: id, score },
      { returning: true }
    );
    res.json({ message: 'Exercise rated', rating });
  } catch (err) {
    res.status(400).json({ message: 'Error rating exercise', error: err.message });
  }
});

app.get('/users/collections', authenticateToken, async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: { userId: req.user.id },
      include: [{ model: Exercise, as: 'exercise' }]
    });
    const saves = await Save.findAll({
      where: { userId: req.user.id },
      include: [{ model: Exercise, as: 'exercise' }]
    });
    const collectionMap = {};
    favorites.forEach(fav => {
      const ex = fav.exercise;
      if (ex) {
        collectionMap[ex.id] = { exercise: ex, isFavorited: true, isSaved: false };
      }
    });
    saves.forEach(save => {
      const ex = save.exercise;
      if (ex) {
        if (collectionMap[ex.id]) {
          collectionMap[ex.id].isSaved = true;
        } else {
          collectionMap[ex.id] = { exercise: ex, isFavorited: false, isSaved: true };
        }
      }
    });
    const collections = Object.values(collectionMap);
    res.json({ collections });
  } catch (err) {
    res.status(400).json({ message: 'Error fetching collections', error: err.message });
  }
});




app.get('/exercises/:id/favorites', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findByPk(id, {
      include: [
        { model: User, as: 'FavoritedBy', attributes: ['id', 'username'] }
      ]
    });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    res.json({ users: exercise.FavoritedBy });
  } catch (err) {
    res.status(400).json({ message: 'Error fetching favorites', error: err.message });
  }
});

app.get('/exercises/:id/saves', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findByPk(id, {
      include: [
        { model: User, as: 'SavedBy', attributes: ['id', 'username'] }
      ]
    });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    res.json({ users: exercise.SavedBy });
  } catch (err) {
    res.status(400).json({ message: 'Error fetching saves', error: err.message });
  }
});


app.get('/public-exercises', async (req, res) => {
  const { sortBy, search } = req.query;
  const whereClause = { isPublic: true };
  if (search) {
    const likeSearch = { [Op.like]: `%${search}%` };
    whereClause[Op.or] = [
      { name: likeSearch },
      { description: likeSearch },
      { difficulty: search }
    ];
  }
  try {
    const exercises = await Exercise.findAll({
      where: whereClause,
      order: sortBy ? [[sortBy, 'ASC']] : [],
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: User, as: 'FavoritedBy', attributes: ['id'] },
        { model: User, as: 'SavedBy', attributes: ['id'] },
      ],
    });
    const data = exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      description: ex.description,
      difficulty: ex.difficulty,
      isPublic: ex.isPublic,
      favoriteCount: ex.FavoritedBy.length,
      saveCount: ex.SavedBy.length,
    }));
    res.json({ exercises: data });
  } catch (err) {
    res.status(400).json({ message: 'Error fetching public exercises', error: err.message });
  }
});

module.exports = app;

const PORT = process.env.PORT || 3000;
sequelize.query('PRAGMA foreign_keys = OFF;')
  .then(() => sequelize.sync({ force: true }))
  .then(() => sequelize.query('PRAGMA foreign_keys = ON;'))
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Error during database sync:', err);
  });

