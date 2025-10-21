const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Media route placeholder' });
});

module.exports = router;
