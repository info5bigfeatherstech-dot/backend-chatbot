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
    answerText: '• Free Shipping: Free delivery is available on all orders above ₹1099 across India (as featured on our storefront banner).\n• Delivery Charges: For orders below ₹1099, delivery charges are calculated live at checkout based on package weight, delivery destination PIN code, and active courier rates.\n• Delivery Timeline: Orders are processed within 24–48 hours and typically delivered within 3 to 7 business days across India.\n• Live Tracking: Once shipped, real-time courier tracking is accessible directly here in chat or under your Account > Orders.',
    sortOrder: 2,
  },
  {
    categoryKey: 'orders',
    categoryTitle: 'Orders & Delivery',
    categoryIcon: '📦',
    questionId: 'cancel_order',
    question: '❌ How to cancel or change my order',
    actionType: 'STATIC_TEXT',
    answerText:
      '❌ How to Cancel or Change Your Order:\n\n1. Before Dispatch (Cancellations & Changes):\n• How to Cancel: Direct self-service cancellation is not available on the website. To request cancellation before dispatch:\n  - Within 24 hours: Go to Account > Orders, open your order, and submit a request using the 24-hour "Request Return / Refund" window, OR\n  - Contact Support: Reach out via email at support.fabuniqo@gmail.com with your Order ID for immediate cancellation.\n• How to Change Details: To update your shipping address, phone number, or modify ordered items, contact customer support immediately before your parcel is packed and handed over to the courier.\n• Prepaid Refunds: 100% of your paid amount will be refunded to your original payment method (UPI / Cards / NetBanking) within 5–7 business days.\n\n2. After Dispatch (In-Transit Orders):\n• Cannot Be Cancelled: Once your order is dispatched from our warehouse and handed over to the courier partner, it cannot be modified or cancelled in-transit.\n• Refusing Delivery (RTO Notice): If delivery is refused at your doorstep, the parcel returns as RTO. Per our policy:\n  - For Partial Prepaid (Advance + COD) orders, the advance payment is non-refundable to cover forward shipping and RTO reverse courier charges.\n  - For 100% Prepaid orders, return courier & forward shipping costs are deducted from the refund once verified at our warehouse.\n\n3. After Delivery:\n• If you receive a damaged or wrong item, you can raise a return request with a continuous unboxing video within 24 hours of delivery from your Account > Orders section.',
    keywords: [
      'cancel',
      'cancellation',
      'cancel order',
      'change order',
      'modify order',
      'change address',
      'cancel item',
      'how to cancel',
      'stop order',
      'change my order',
    ],
    sortOrder: 3,
  },
  {
    categoryKey: 'orders',
    categoryTitle: 'Orders & Delivery',
    categoryIcon: '📦',
    questionId: 'delivered_not_received',
    question: '⚠️ Order marked delivered but not received',
    actionType: 'DELIVERY_DISPUTE_PROMPT',
    answerText:
      'Please enter your Order ID (e.g. #FAB-ECOMM-187286) below so we can check the delivery status in our database and escalate with the courier:',
    keywords: [
      'delivered but not received',
      'marked delivered',
      'not received',
      'haven\'t received',
      'fake delivery',
      'order not received',
      'package not delivered',
    ],
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
    questionId: 'cheaper_products',
    question: '🪙 Cheaper / Budget-Friendly Products',
    actionType: 'CHEAP_PRODUCTS',
    answerText: 'Here are our most affordable budget-friendly pieces starting at great prices:',
    sortOrder: 2,
  },
  {
    categoryKey: 'products',
    categoryTitle: 'Products & Catalog',
    categoryIcon: '🛍️',
    questionId: 'expensive_products',
    question: '💎 Expensive / Luxury Products',
    actionType: 'EXPENSIVE_PRODUCTS',
    answerText: 'Here are our most exclusive, high-end luxury pieces:',
    sortOrder: 3,
  },
  {
    categoryKey: 'products',
    categoryTitle: 'Products & Catalog',
    categoryIcon: '🛍️',
    questionId: 'out_of_stock',
    question: '⏳ When will out-of-stock items be back?',
    actionType: 'STATIC_TEXT',
    answerText: 'Popular items are usually restocked within 7–10 days. You can leave your contact info with us or check back next week!',
    sortOrder: 5,
  },
  {
    categoryKey: 'products',
    categoryTitle: 'Products & Catalog',
    categoryIcon: '🛍️',
    questionId: 'size_guide',
    question: '📏 Sizing and measurement guide',
    actionType: 'STATIC_TEXT',
    answerText: 'Detailed measurements and sizing charts are available directly on each product page just below the price and variant selection.',
    sortOrder: 6,
  },

  // 3. RETURNS & REFUNDS
  {
    categoryKey: 'returns',
    categoryTitle: 'Returns & Refunds',
    categoryIcon: '🔄',
    questionId: 'return_policy',
    question: '📋 What is your return policy?',
    actionType: 'STATIC_TEXT',
    answerText: 'As per our official Return & Refund Policy (/policies/return-refund):\n• Eligible Reasons: Returns are accepted only for Damaged items received or Wrong items delivered (change of mind is not eligible).\n• Reporting Window: Return requests must be raised within 24 hours of delivery.\n• Mandatory Proof: A continuous, uncut unboxing video showing the sealed parcel from start to finish, along with 1 to 3 clear photos of the issue.\n• Refunds: Processed to your original payment method (or bank transfer for COD) once the item is received and verified at our warehouse.',
    sortOrder: 1,
  },
  {
    categoryKey: 'returns',
    categoryTitle: 'Returns & Refunds',
    categoryIcon: '🔄',
    questionId: 'request_return',
    question: '🔄 How do I initiate a return?',
    actionType: 'STATIC_TEXT',
    answerText:
      '📋 How to Initiate a Return on FABUNIQO:\n\n1. Go to Your Orders:\n• Navigate to Account > Orders and open your delivered order.\n\n2. Click "Raise Return Request":\n• The "Raise Return Request" button appears on delivered orders strictly within 24 hours of delivery.\n\n3. Complete the Return Form (Mandatory Proofs):\n• Eligible Reasons: Choose either "Damaged Item Received" or "Wrong Item Delivered" (change of mind is not accepted per store policy).\n• Unboxing Video (Mandatory): Upload a continuous, uncut unboxing video (up to 60MB) starting from the sealed outer package to showing the issue.\n• Proof Photos: Attach 1 to 3 clear photos of the issue.\n• Describe the Issue: Enter a short description (up to 500 characters).\n\n4. Review & Doorstep Pickup:\n• Once submitted, a dedicated Return Support Chat opens directly on your order details page.\n• Our verification team reviews your unboxing video and photos.\n• Upon approval, a reverse pickup AWB is generated and our courier partner will collect the parcel from your doorstep.\n\n5. Refund Processing:\n• Once the returned parcel reaches our warehouse and passes physical inspection, your refund is credited:\n  - Prepaid Orders: Refunded to your original payment method (bank/card/UPI) within 5–10 business days.\n  - Cash on Delivery (COD): Refunded via support-assisted UPI or Bank Transfer.\n\n⚠️ Important Window: Return requests must be submitted within 24 hours of delivery. After 24 hours, the return window closes. For urgent assistance, reach our support team via email at support.fabuniqo@gmail.com.',
    sortOrder: 2,
  },
  {
    categoryKey: 'returns',
    categoryTitle: 'Returns & Refunds',
    categoryIcon: '🔄',
    questionId: 'refund_timeline',
    question: '💰 Refund timeline & process',
    actionType: 'STATIC_TEXT',
    answerText: 'Once the returned package reaches our warehouse and passes verification:\n• Online Payments: Refund is processed via original payment gateway (credited to your bank/card within 5 to 10 business days).\n• Cash on Delivery (COD): Refund is transferred via support-assisted UPI/Bank Transfer after verification.',
    sortOrder: 3,
  },
  {
    categoryKey: 'returns',
    categoryTitle: 'Returns & Refunds',
    categoryIcon: '🔄',
    questionId: 'damaged_product',
    question: '💔 Received damaged or defective item',
    actionType: 'STATIC_TEXT',
    answerText: 'We apologize! Please take a quick photo of the defective item along with your continuous unboxing video, and raise a return under Account > Orders or contact support within 24 hours of delivery for a free instant resolution.',
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
    answerText: 'We accept:\n• Online Payment: UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay), and Net Banking via secure online checkout.\n• Cash on Delivery (COD): Available across serviceable PIN codes.\n• Partial Advance + COD: Select orders support paying a partial online advance with the remaining balance due on delivery.',
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
    question: '🏷️ Available Coupons to Apply',
    actionType: 'VIEW_COUPONS',
    answerText: 'Here are the active discount coupons available for your order:',
    sortOrder: 4,
  },

  // 5. CONTACT SUPPORT
  {
    categoryKey: 'support',
    categoryTitle: 'Contact Support',
    categoryIcon: '📞',
    questionId: 'contact_details',
    question: '✉ Official Customer Support (Email)',
    actionType: 'CONTACT_CARD',
    answerText: 'You can reach our customer support team directly via email at support.fabuniqo@gmail.com.',
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
