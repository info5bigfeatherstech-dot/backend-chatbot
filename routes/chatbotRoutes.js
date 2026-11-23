const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Routes
router.get('/welcome', chatbotController.getWelcome);
router.get('/category/:categoryKey', chatbotController.getCategoryQuestions);
router.post('/answer', chatbotController.getAnswer);
router.post('/track-order', chatbotController.trackOrder);
router.post('/user-orders', chatbotController.getUserOrders);
router.get('/best-sellers', chatbotController.getBestSellers);
router.get('/coupons', chatbotController.getAvailableCoupons);
router.get('/cheaper-products', chatbotController.getCheaperProducts);
router.get('/expensive-products', chatbotController.getExpensiveProducts);
router.post('/ticket', chatbotController.createTicket);
router.post('/query', chatbotController.handleGeneralQuery);

module.exports = router;
