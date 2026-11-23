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
router.post('/check-pincode', chatbotController.checkPincode);
router.post('/check-return-refund', chatbotController.checkReturnRefundStatus);
router.post('/exchange-inquiry', chatbotController.getExchangeInquiry);
router.post('/cod-refund-info', chatbotController.getCodRefundInfo);
router.post('/partial-payment-info', chatbotController.getPartialPaymentInfo);
router.post('/free-shipping-info', chatbotController.getFreeShippingInfo);
router.post('/emi-info', chatbotController.getEmiInfo);
router.post('/payment-safety-info', chatbotController.getPaymentSafetyInfo);
router.post('/gst-invoice-info', chatbotController.getGstInvoiceInfo);
router.post('/browse-categories', chatbotController.browseCategories);
router.post('/jewelry-care', chatbotController.getJewelryCareInfo);
router.post('/gift-packaging', chatbotController.getGiftPackagingInfo);
router.post('/hypoallergenic-info', chatbotController.getHypoallergenicInfo);
router.get('/cheaper-products', chatbotController.getCheaperProducts);
router.get('/expensive-products', chatbotController.getExpensiveProducts);
router.post('/ticket', chatbotController.createTicket);
router.post('/query', chatbotController.handleGeneralQuery);

module.exports = router;
