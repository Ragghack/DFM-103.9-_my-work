const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Economy route placeholder' });
});

module.exports = router;
