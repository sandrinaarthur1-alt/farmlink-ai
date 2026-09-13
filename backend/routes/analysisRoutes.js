const express = require('express');
const router = express.Router();

const {
  analyzeFarmer
} = require('../controllers/analysisController');

router.post('/analyze', analyzeFarmer);

module.exports = router;