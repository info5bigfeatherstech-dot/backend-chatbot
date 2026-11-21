const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Routes
router.get('/welcome', chatbotController.getWelcome);
router.get('/category/:categoryKey', chatbotController.getCategoryQuestions);
router.post('/answer', chatbotController.getAnswer);
router.post('/track-order', chatbotController.trackOrder);
router.get('/best-sellers', chatbotController.getBestSellers);
router.post('/ticket', chatbotController.createTicket);

module.exports = router;
