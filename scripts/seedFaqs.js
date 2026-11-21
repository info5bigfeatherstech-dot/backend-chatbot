require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ChatFaq = require('../models/ChatFaq');

const initialFaqs = [
  // 1. ORDERS & DELIVERY
  {
    categoryKey: 'orders',
    categoryTitle: 'Orders & Delivery',
    categoryIcon: '📦',
    questionId: 'track_order',
    question: '🔍 Track my order',
    actionType: 'ORDER_TRACK',
    answerText: 'Please enter your Order ID (e.g. #1024) or 10-digit mobile number to track your package.',
    sortOrder: 1,
  },
  {
    categoryKey: 'orders',
    categoryTitle: 'Orders & Delivery',
    categoryIcon: '📦',
    questionId: 'delivery_charges_timeline',
    question: '🚚 Delivery charges & delivery timeline',
    actionType: 'STATIC_TEXT',
    answerText: 'Standard delivery takes 3 to 5 business days across India. Free shipping is available on orders above ₹499. For orders below ₹499, a nominal delivery fee of ₹49 applies.',
    sortOrder: 2,
  },
  {
    categoryKey: 'orders',
    categoryTitle: 'Orders & Delivery',
    categoryIcon: '📦',
    questionId: 'cancel_order',
    question: '❌ How to cancel or change my order',
    actionType: 'STATIC_TEXT',
    answerText: 'You can cancel an order before it has been dispatched from your Account > Orders section. If the package is already shipped, you can refuse delivery at your doorstep or initiate a return upon arrival.',
    sortOrder: 3,
  },
  {
    categoryKey: 'orders',
    categoryTitle: 'Orders & Delivery',
    categoryIcon: '📦',
    questionId: 'delivered_not_received',
    question: '⚠️ Order marked delivered but not received',
    actionType: 'STATIC_TEXT',
    answerText: 'Sometimes couriers mark packages delivered slightly before handing them over, or a family member/security desk received it. If you still cannot locate it within 4 hours, please contact our support team immediately.',
    sortOrder: 4,
  },

  // 2. PRODUCTS & CATALOG
  {
    categoryKey: 'products',
    categoryTitle: 'Products & Catalog',
    categoryIcon: '🛍️',
    questionId: 'best_sellers',
    question: '🔥 View Best Sellers / Top Products',
    actionType: 'BEST_SELLERS',
    answerText: 'Here are our most popular and highest rated products:',
    sortOrder: 1,
  },
  {
    categoryKey: 'products',
    categoryTitle: 'Products & Catalog',
    categoryIcon: '🛍️',
    questionId: 'product_authenticity',
    question: '✨ Product quality & authenticity',
    actionType: 'STATIC_TEXT',
    answerText: 'Every piece at FABUNIQO is crafted with premium quality standards, rigorous quality inspection, and authentic materials before shipment.',
    sortOrder: 2,
  },
  {
    categoryKey: 'products',
    categoryTitle: 'Products & Catalog',
    categoryIcon: '🛍️',
    questionId: 'out_of_stock',
    question: '⏳ When will out-of-stock items be back?',
    actionType: 'STATIC_TEXT',
    answerText: 'Popular items are usually restocked within 7–10 days. You can leave your contact info with us or check back next week!',
    sortOrder: 3,
  },
  {
    categoryKey: 'products',
    categoryTitle: 'Products & Catalog',
    categoryIcon: '🛍️',
    questionId: 'size_guide',
    question: '📏 Sizing and measurement guide',
    actionType: 'STATIC_TEXT',
    answerText: 'Detailed measurements and sizing charts are available directly on each product page just below the price and variant selection.',
    sortOrder: 4,
  },

  // 3. RETURNS & REFUNDS
  {
    categoryKey: 'returns',
    categoryTitle: 'Returns & Refunds',
    categoryIcon: '🔄',
    questionId: 'return_policy',
    question: '📋 What is your return policy?',
    actionType: 'STATIC_TEXT',
    answerText: 'We offer a hassle-free 7-day return and exchange window from the date of delivery for unworn items with tags and original packaging intact.',
    sortOrder: 1,
  },
  {
    categoryKey: 'returns',
    categoryTitle: 'Returns & Refunds',
    categoryIcon: '🔄',
    questionId: 'request_return',
    question: '🔄 How do I initiate a return?',
    actionType: 'STATIC_TEXT',
    answerText: 'Go to your Account > Orders page, select the order you wish to return, click "Request Return", and choose your reason. Our courier partner will schedule a doorstep pickup.',
    sortOrder: 2,
  },
  {
    categoryKey: 'returns',
    categoryTitle: 'Returns & Refunds',
    categoryIcon: '🔄',
    questionId: 'refund_timeline',
    question: '💰 Refund timeline & process',
    actionType: 'STATIC_TEXT',
    answerText: 'Once the returned item reaches our fulfillment warehouse and passes quality inspection, refunds are processed within 24–48 hours to your original payment method (or bank account for COD orders).',
    sortOrder: 3,
  },
  {
    categoryKey: 'returns',
    categoryTitle: 'Returns & Refunds',
    categoryIcon: '🔄',
    questionId: 'damaged_product',
    question: '💔 Received damaged or defective item',
    actionType: 'STATIC_TEXT',
    answerText: 'We apologize! Please take a quick photo of the defective item and share it with us via WhatsApp or support ticket within 48 hours of delivery for a free instant replacement.',
    sortOrder: 4,
  },

  // 4. PAYMENTS & OFFERS
  {
    categoryKey: 'payments',
    categoryTitle: 'Payments & Offers',
    categoryIcon: '💳',
    questionId: 'payment_methods',
    question: '💳 Accepted payment methods',
    actionType: 'STATIC_TEXT',
    answerText: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Cash on Delivery (COD).',
    sortOrder: 1,
  },
  {
    categoryKey: 'payments',
    categoryTitle: 'Payments & Offers',
    categoryIcon: '💳',
    questionId: 'payment_failed_deducted',
    question: '⚠️ Money deducted but order failed',
    actionType: 'STATIC_TEXT',
    answerText: 'If your money was deducted but your order was not confirmed, bank payment gateways automatically refund the amount back to your account within 24 to 48 business hours.',
    sortOrder: 2,
  },
  {
    categoryKey: 'payments',
    categoryTitle: 'Payments & Offers',
    categoryIcon: '💳',
    questionId: 'cod_availability',
    question: '💵 Is Cash on Delivery (COD) available?',
    actionType: 'STATIC_TEXT',
    answerText: 'Yes, Cash on Delivery (COD) is available across most serviceable pin codes throughout India. You can select COD on the checkout payment step.',
    sortOrder: 3,
  },
  {
    categoryKey: 'payments',
    categoryTitle: 'Payments & Offers',
    categoryIcon: '💳',
    questionId: 'apply_coupons',
    question: '🏷️ How to apply discount coupons',
    actionType: 'STATIC_TEXT',
    answerText: 'On the Checkout page, look for the "Apply Coupon" field on the right side of the screen. Enter your promo code and click "Apply" to enjoy instant savings.',
    sortOrder: 4,
  },

  // 5. CONTACT SUPPORT
  {
    categoryKey: 'support',
    categoryTitle: 'Contact Support',
    categoryIcon: '📞',
    questionId: 'contact_details',
    question: '📞 Official Phone & WhatsApp Support',
    actionType: 'CONTACT_CARD',
    answerText: 'You can reach our customer support team directly via WhatsApp or Phone.',
    sortOrder: 1,
  },
  {
    categoryKey: 'support',
    categoryTitle: 'Contact Support',
    categoryIcon: '📞',
    questionId: 'working_hours_email',
    question: '⏰ Operating hours & support email',
    actionType: 'STATIC_TEXT',
    answerText: 'Our support team is available Monday to Saturday, 10:00 AM to 7:00 PM IST. You can also email us anytime at info1.fabuniqo@gmail.com.',
    sortOrder: 2,
  },
  {
    categoryKey: 'support',
    categoryTitle: 'Contact Support',
    categoryIcon: '📞',
    questionId: 'leave_ticket',
    question: '📝 Leave a message / Raise support ticket',
    actionType: 'RAISE_TICKET',
    answerText: 'Please enter your phone number or email and your question, and our team will get back to you promptly.',
    sortOrder: 3,
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_DB_URI;
    if (!mongoUri) throw new Error('MONGO_DB_URI is missing in .env');

    console.log('[Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected.');

    await ChatFaq.deleteMany({});
    await ChatFaq.insertMany(initialFaqs);
    console.log(`[Seed] Successfully inserted ${initialFaqs.length} chatbot FAQs!`);

    await mongoose.connection.close();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
}

seed();
