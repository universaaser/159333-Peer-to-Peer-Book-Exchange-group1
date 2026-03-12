const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/reports', require('./routes/reports'));

app.get('/', (req, res) => {
  res.json({ message: 'P2P Book Exchange API is running' });
});

module.exports = app;
