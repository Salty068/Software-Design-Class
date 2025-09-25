const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('volunteer_app', 'volunteer_user', 'volunteer_pass', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false,
});

sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ DB Error:', err));

module.exports = sequelize;
