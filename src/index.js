const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');

const app = express();

// utilisation de bodyParser
app.use(bodyParser.json());

// Endpoints
app.use('/api/users', userRoutes);

// Ex: endpoint de test
app.get('/', (req, res) => {
  res.send('Vulnerable Node.js project is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
