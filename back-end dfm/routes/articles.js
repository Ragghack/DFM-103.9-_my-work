const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Articles route placeholder' });
});

module.exports = router;
