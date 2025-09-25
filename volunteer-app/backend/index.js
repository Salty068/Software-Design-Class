const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);

// Sync DB and start server
sequelize.sync().then(() => {
  app.listen(5000, () => console.log('Server running on port 5000'));
});
