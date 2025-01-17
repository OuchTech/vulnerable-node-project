const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'User route is working, but vulnerable endpoints go here...' });
});

module.exports = router;
