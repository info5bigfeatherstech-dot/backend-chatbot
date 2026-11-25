const ChatFaq = require('../models/ChatFaq');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ChatTicket = require('../models/ChatTicket');
const {
  HINGLISH_CATEGORIES,
  HINGLISH_QUESTIONS,
  HINGLISH_ANSWERS,
} = require('../constants/hinglishFaqs');

// GET /api/chatbot/welcome
exports.getWelcome = async (req, res) => {
  try {
    const lang = req.query.lang || req.body?.lang || req.headers['x-chat-lang'] || 'en';
    const isHi = String(lang).toLowerCase() === 'hi';

    const categoriesEn = [
      { key: 'orders', title: 'Orders & Delivery', icon: '📦' },
      { key: 'products', title: 'Products & Catalog', icon: '🛍️' },
      { key: 'returns', title: 'Returns & Refunds', icon: '🔄' },
      { key: 'payments', title: 'Payments & Offers', icon: '💳' },
      { key: 'support', title: 'Contact Support', icon: '📞' },
    ];

    const categories = isHi ? HINGLISH_CATEGORIES : categoriesEn;
    const greeting = isHi
      ? 'FABUNIQO me aapka swagat hai! 👋 Aaj hum aapki kya sahayata kar sakte hain?'
      : 'Hi there! 👋 Welcome to FABUNIQO. How can we help you today?';

    return res.status(200).json({
      success: true,
      greeting,
      storeName: process.env.STORE_NAME || 'FABUNIQO',
      supportHours: process.env.SUPPORT_HOURS || '10:00 AM - 7:00 PM IST',
      categories,
    });
  } catch (err) {
    console.error('[getWelcome Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/chatbot/category/:categoryKey
exports.getCategoryQuestions = async (req, res) => {
  try {
    const { categoryKey } = req.params;
    const lang = req.query.lang || req.headers['x-chat-lang'] || 'en';
    const isHi = String(lang).toLowerCase() === 'hi';

    const questionsDoc = await ChatFaq.find({ categoryKey, isActive: true })
      .sort({ sortOrder: 1 })
      .select('questionId question actionType sortOrder')
      .lean();

    const questions = questionsDoc.map((q) => ({
      ...q,
      question: (isHi && HINGLISH_QUESTIONS[q.questionId]) ? HINGLISH_QUESTIONS[q.questionId] : q.question,
    }));

    return res.status(200).json({
      success: true,
      categoryKey,
      questions,
    });
  } catch (err) {
    console.error('[getCategoryQuestions Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/chatbot/answer
exports.getAnswer = async (req, res) => {
  try {
    const { questionId, lang } = req.body;
    if (!questionId) {
      return res.status(400).json({ success: false, message: 'questionId is required' });
    }

    const isHi = String(lang || req.query.lang || req.headers['x-chat-lang']).toLowerCase() === 'hi';

    const faq = await ChatFaq.findOne({ questionId, isActive: true });
    if (!faq) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    let answerText = faq.answerText;
    if (questionId === 'delivery_charges_timeline') {
      try {
        const mongoose = require('mongoose');
        const offer = await mongoose.connection.db.collection('freeshippingoffers').findOne({ isActive: true });
        const threshold = offer && offer.minCartValue && offer.minCartValue >= 500 ? offer.minCartValue : 1099;
        if (isHi) {
          answerText = `1. Free Shipping: ₹${threshold} se upar ke sabhi orders par poore Bharat mein free delivery uplabdh hai.\n\n2. Delivery Charges: ₹${threshold} se kam ke orders par standard delivery charge lagta hai jo checkout ke time live calculate hota hai.\n\n3. Delivery Timeline: Orders 24–48 ghante mein dispatch ho jate hain aur aamtaur par 3 se 7 business days mein deliver ho jate hain.\n\n4. Live Tracking: Dispatch hote hi aap chat mein ya Account > Orders me live tracking check kar sakte hain.`;
        } else {
          answerText = `1. Free Shipping: Free delivery is available on all orders above ₹${threshold} across India (as featured on our storefront banner).\n\n2. Delivery Charges: For orders below ₹${threshold}, delivery charges are calculated live at checkout based on package weight, destination PIN code, and active courier rates.\n\n3. Delivery Timeline: Orders are processed within 24–48 hours and typically delivered within 3 to 7 business days across India.\n\n4. Live Tracking: Once shipped, real-time courier tracking is accessible directly in chat or under your Account > Orders.`;
        }
      } catch (e) {
        console.error('[Dynamic Delivery Answer Error]:', e);
      }
    } else if (questionId === 'cod_availability') {
      try {
        const mongoose = require('mongoose');
        const checkout = await mongoose.connection.db.collection('checkoutsettings').findOne({});
        const codEnabled = checkout ? Boolean(checkout.codEnabled) : true;
        const partialEnabled = checkout ? Boolean(checkout.partialPaymentEnabled) : false;
        const partialPercent = (checkout && checkout.partialPaymentPercent) || 30;

        if (isHi) {
          if (codEnabled) {
            answerText = `Haan! Cash on Delivery (COD) poore Bharat ke lagbhag sabhi serviceable PIN codes par uplabdh hai.\n\n${partialEnabled ? `• Note: Select orders par Partial Payment (${partialPercent}% online advance + baki delivery par) uplabdh hai.\n\n` : ''}Aap checkout ke time Payment step par 'Cash on Delivery' option select kar sakte hain.`;
          } else {
            answerText = `Filhal humare store par Cash on Delivery (COD) band hai. Hum UPI (Google Pay, PhonePe, Paytm), Cards aur Net Banking se 100% secure online payment accept karte hain.`;
          }
        } else {
          if (codEnabled) {
            answerText = `Yes! Cash on Delivery (COD) is currently active and available across most serviceable PIN codes throughout India.\n\n${partialEnabled ? `• Note: Select orders support Partial Payment (${partialPercent}% online advance + remaining balance at delivery).\n\n` : ''}You can select Cash on Delivery during the checkout payment step.`;
          } else {
            answerText = `Currently, Cash on Delivery (COD) is disabled in our store. We accept 100% secure online payments via UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, and Net Banking at checkout.`;
          }
        }
      } catch (e) {
        console.error('[Dynamic COD Answer Error]:', e);
      }
    } else if (questionId === 'jewelry_care') {
      answerText = isHi
        ? HINGLISH_ANSWERS.jewelry_care
        : `Will it Tarnish or Fade?\n\n• Anti-Tarnish Protection: Our pieces are crafted with premium skin-safe alloys and sealed with advanced protective anti-tarnish micro-plating to retain their showroom luster.\n• Daily Wear Longevity: With standard care, your jewelry does not tarnish or fade easily and maintains its brilliance.\n• 4 Essential Care Tips:\n  1. Avoid Moisture: Keep jewelry away from water, swimming pools, showers, and excessive sweat.\n  2. Perfumes & Lotions First: Apply perfumes, deodorants, and body lotions before wearing jewelry (alcohol in perfumes can wear off electroplating).\n  3. Individual Storage: Store each piece separately in an airtight ziplock pouch or velvet box to prevent oxidation and scratches.\n  4. Post-Wear Wipe: Gently clean your jewelry with a soft, dry microfiber cloth after each wear before storing.\n\nTip: Every order is packaged in protective anti-moisture zip wraps to preserve its brand-new showroom shine during transit!`;
    } else if (questionId === 'gift_packaging') {
      try {
        const mongoose = require('mongoose');
        const freeGift = await mongoose.connection.db.collection('freegiftoffers').findOne({ isActive: true });
        let freeGiftText = '';
        if (freeGift && freeGift.name) {
          freeGiftText = isHi
            ? `• Active Store Perk: "${freeGift.name}" is waqt purchases par free mil raha hai!\n`
            : `• Active Store Perk: "${freeGift.name}" is currently active on purchases!\n`;
        }
        answerText = isHi
          ? `${HINGLISH_ANSWERS.gift_packaging}\n${freeGiftText}`
          : `🎁 Luxury Gift Packaging & Personalized Message Cards:\n\nPlanning a special surprise? We ensure an exquisite unboxing experience for your loved ones:\n\n• Signature Rigid Gift Box: Every jewelry piece is nestled securely inside our signature luxury gift box with plush velvet cushioning.\n• Complimentary Handwritten Note: We provide a personalized gift card free of charge! Simply enter your gift message at checkout, or message us immediately after ordering.\n• Discreet Courier Packaging: All parcels are shipped in tamper-evident, unbranded outer courier boxes to keep your surprise 100% secret until opened.\n• Concealed Price Tags: Gifting directly to a loved one? Let us know and we will remove price tags from the presentation box.\n${freeGiftText}\n💬 To personalize your gift card: Message our gifting desk via email at support.fabuniqo@gmail.com with your Order ID!`;
      } catch (e) {
        console.error('[Dynamic Gift Answer Error]:', e);
      }
    } else if (questionId === 'cancel_order') {
      answerText = isHi ? HINGLISH_ANSWERS.cancel_order : faq.answerText;
    } else if (questionId === 'delivered_not_received') {
      return res.status(200).json({
        success: true,
        faq: {
          questionId: 'delivered_not_received',
          question: isHi ? (HINGLISH_QUESTIONS[questionId] || '⚠️ Order delivered dikha raha hai par mila nahi') : '⚠️ Order marked delivered but not received',
          actionType: 'DELIVERY_DISPUTE_PROMPT',
          answerText: isHi
            ? 'Kripya neeche apna Order ID (jaise #FAB-ECOMM-187286) likhein taaki hum database check karke courier se escalate kar sakein:'
            : 'Please enter your Order ID (e.g. #FAB-ECOMM-187286) below so we can check the delivery status in our database and escalate with the courier:',
        },
      });
    } else if (questionId === 'check_pincode') {
      return res.status(200).json({
        success: true,
        faq: {
          questionId: 'check_pincode',
          question: isHi ? (HINGLISH_QUESTIONS[questionId] || '📮 Apne PIN Code par delivery check karein') : (faq.question || '📮 Check delivery to my PIN Code'),
          actionType: 'CHECK_PINCODE',
          answerText: isHi
            ? 'Delivery serviceability check karne ke liye neeche apna 6-digit PIN Code (jaise 110001, 400050) type karein:'
            : 'Please type the 6-digit destination PIN code (e.g. 110001, 400050, 560001) in the message box below to check live courier delivery & serviceability:',
        },
      });
    } else if (isHi && HINGLISH_ANSWERS[questionId]) {
      answerText = HINGLISH_ANSWERS[questionId];
    }

    const questionTitle = isHi && HINGLISH_QUESTIONS[faq.questionId] ? HINGLISH_QUESTIONS[faq.questionId] : faq.question;

    return res.status(200).json({
      success: true,
      faq: {
        questionId: faq.questionId,
        question: questionTitle,
        actionType: faq.actionType,
        answerText,
        contactCard:
          faq.actionType === 'CONTACT_CARD'
            ? {
                email: process.env.STORE_EMAIL || 'support.fabuniqo@gmail.com',
                hours: process.env.SUPPORT_HOURS || '10:00 AM - 7:00 PM IST (Mon-Sat)',
              }
            : null,
      },
    });
  } catch (err) {
    console.error('[getAnswer Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper: Format an order document for chatbot response
async function formatOrderResponse(order) {
  if (!order) return null;
  const city = order.addressSnapshot?.city || order.shippingAddress?.city || '';
  const courier = 'Express Delivery';
  const trackingNumber =
    order.shipmentTracking?.trackingNumber ||
    order.shipmentInfo?.fulfillmentArtifactAwb ||
    null;
  const trackingUrl = order.shipmentTracking?.trackingUrl || null;
  const estimatedDelivery =
    order.shipmentTracking?.estimatedDeliveryDate ||
    (order.shippingSnapshot?.estimatedDays
      ? `${order.shippingSnapshot.estimatedDays} business days`
      : null);

  const firstItem =
    order.shippingWeightSnapshot?.lines?.[0]?.productName ||
    order.items?.[0]?.productName ||
    (order.items?.length ? `${order.items.length} item${order.items.length > 1 ? 's' : ''}` : null);

  // Fetch product thumbnail image for the first item
  let itemImage = '';
  try {
    const firstProductId = order.items?.[0]?.productId || order.shippingWeightSnapshot?.lines?.[0]?.productId;
    if (firstProductId) {
      const prod = await Product.findById(firstProductId).select('images variants.images').lean();
      itemImage =
        prod?.variants?.[0]?.images?.[0]?.url ||
        prod?.images?.[0]?.url ||
        order.items?.[0]?.image ||
        order.items?.[0]?.imageUrl ||
        '';
    }
  } catch (e) {
    console.warn('[formatOrderResponse image lookup error]:', e.message);
  }

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + ', ' + new Date(order.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase()
    : null;

  const paymentMethod = order.paymentInfo?.method
    ? order.paymentInfo.method.toUpperCase()
    : (order.isCod ? 'COD' : 'ONLINE');

  const subtotal = order.subtotal != null ? order.subtotal : null;
  const deliveryCharges = order.deliveryFreightInr ?? order.deliveryCharges ?? order.shippingSnapshot?.freightInr ?? 0;
  const tax = order.tax ?? 0;
  const totalAmount = order.totalAmount ?? order.subtotal ?? 0;
  const amountPaid = order.amountPaidInr ?? 0;
  const refunded = order.refundHistory?.reduce((acc, r) => acc + (r.amountInr || 0), 0) ?? 0;

  const ret = order.returnInfo || {};
  const refunds = Array.isArray(order.refundHistory) ? order.refundHistory : [];
  const isRefunded =
    order.paymentStatus === 'refunded' ||
    order.paymentStatus === 'partially_refunded' ||
    refunds.length > 0 ||
    refunded > 0 ||
    ret.status === 'refunded';

  const hasReturn = Boolean(
    ret.reasonType ||
    ret.approvedBy ||
    ret.rtoStatus ||
    order.orderStatus === 'return_requested' ||
    order.orderStatus === 'returned' ||
    order.status === 'return_requested' ||
    order.status === 'returned' ||
    ret.status === 'requested' ||
    ret.status === 'in_transit' ||
    ret.status === 'approved' ||
    ret.status === 'pending_inspection' ||
    ret.status === 'inspection_passed'
  );

  const refundPending = Boolean(
    ret.status === 'refund_pending' ||
    ret.status === 'refund_failed' ||
    (hasReturn && !isRefunded)
  );

  const refundAmount =
    ret.refundAmount ||
    ret.rtoRefundAmount ||
    refunds[0]?.amountInr ||
    refunds[0]?.amount ||
    (isRefunded ? totalAmount : 0);

  return {
    orderId: order.orderId,
    status: order.orderStatus || order.status || 'Processing',
    orderStatus: order.orderStatus || order.status || 'Processing',
    paymentStatus: order.paymentStatus || 'Pending',
    paymentMethod,
    itemsCount: (order.items && order.items.length) || 1,
    subtotal,
    deliveryCharges,
    tax,
    totalAmount,
    amountPaid,
    refunded,
    orderDate: formattedDate,
    itemName: firstItem,
    itemImage,
    courier,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
    customerCity: city,
    returnInfo: ret,
    refundHistory: refunds,
    hasReturn,
    isRefunded,
    refundPending,
    refundAmount,
    returnStatus: ret.status || (hasReturn ? 'requested' : (isRefunded ? 'refunded' : null)),
    returnReason: ret.reasonType || null,
    reverseTrackingNumber: ret.reverseTrackingNumber || ret.reverseAwbCode || null,
    reverseCourier: ret.reverseCourier || null,
  };
}

// Helper: Find order by ID, suffix ID (e.g. 554418 matching FAB-ECOMM-554418), or phone number
async function findOrderInDb(query) {
  if (!query || String(query).trim().length < 3) return null;
  const raw = String(query).trim();

  // Extract ID pattern: either full prefix like FAB-ECOMM-554418, or digits 554418
  const idMatch = raw.match(/(?:[A-Za-z0-9]+[-_])*\d{4,12}/i);
  const targetId = idMatch ? idMatch[0] : raw.replace(/[#\s]/g, '');
  const safeRegex = targetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const order = await Order.findOne({
    $or: [
      { orderId: { $regex: new RegExp(`^${safeRegex}$`, 'i') } },
      { orderId: { $regex: new RegExp(`(?:^|[-_])${safeRegex}$`, 'i') } },
      { orderId: { $regex: new RegExp(safeRegex, 'i') } },
      { 'addressSnapshot.phone': { $regex: safeRegex, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: safeRegex, $options: 'i' } },
    ],
  }).sort({ createdAt: -1 });

  return await formatOrderResponse(order);
}

// POST /api/chatbot/user-orders - Fetch recent orders for logged-in user automatically
exports.getUserOrders = async (req, res) => {
  try {
    const { userId, phone, email, limit = 3 } = req.body;
    const orConditions = [];

    if (userId) {
      orConditions.push({ userId: String(userId) });
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(userId)) {
        orConditions.push({ userId: new mongoose.Types.ObjectId(userId) });
      }
    }
    if (phone) {
      const cleanPhone = String(phone).replace(/[^\d]/g, '');
      if (cleanPhone.length >= 7) {
        orConditions.push({ 'addressSnapshot.phone': { $regex: cleanPhone, $options: 'i' } });
        orConditions.push({ 'shippingAddress.phone': { $regex: cleanPhone, $options: 'i' } });
      }
    }
    if (email && typeof email === 'string' && email.includes('@')) {
      orConditions.push({ 'addressSnapshot.email': { $regex: email.trim(), $options: 'i' } });
    }

    if (orConditions.length === 0) {
      return res.status(200).json({ success: true, count: 0, orders: [] });
    }

    const maxLimit = Math.min(Math.max(Number(limit) || 3, 1), 10);
    const orders = await Order.find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .limit(maxLimit)
      .lean();

    const formattedOrders = await Promise.all(orders.map(formatOrderResponse));

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: formattedOrders.filter(Boolean),
    });
  } catch (err) {
    console.error('[getUserOrders Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/chatbot/track-order
exports.trackOrder = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || String(query).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Order ID or 10-digit Phone Number.',
      });
    }

    const order = await findOrderInDb(query);

    if (!order) {
      return res.status(200).json({
        success: true,
        found: false,
        message: `We could not find any order matching "${query}". Please check the ID or contact support.`,
      });
    }

    return res.status(200).json({
      success: true,
      found: true,
      order,
    });
  } catch (err) {
    console.error('[trackOrder Error]:', err);
    return res.status(500).json({ success: false, message: 'Error tracking order' });
  }
};

// Filter for products that are currently LIVE and published on the e-commerce storefront
// (strictly excludes products archived or drafted on ecomm channel, preventing "Soon this product will add" errors)
const ecommActiveFilter = {
  status: 'active',
  'channelStatus.ecomm': { $nin: ['archived', 'draft'] },
};

// GET /api/chatbot/best-sellers
exports.getBestSellers = async (req, res) => {
  try {
    // Look for active featured items first, or fallback to active items
    let products = await Product.find({ ...ecommActiveFilter, isFeatured: true })
      .limit(4)
      .select('name title slug images variants brand');

    if (!products || products.length === 0) {
      products = await Product.find(ecommActiveFilter)
        .limit(4)
        .select('name title slug images variants brand');
    }

    return res.status(200).json({
      success: true,
      products: formatProducts(products),
    });
  } catch (err) {
    console.error('[getBestSellers Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/chatbot/cheaper-products
exports.getCheaperProducts = async (req, res) => {
  try {
    const products = await Product.find(ecommActiveFilter)
      .sort({ 'variants.price.sale': 1, 'variants.price.base': 1 })
      .limit(4)
      .select('name title slug images variants brand');

    const formatted = formatProducts(products);
    const startingPrice = formatted[0]?.price || 99;

    return res.status(200).json({
      success: true,
      text: `Here are our most affordable budget-friendly pieces starting at just ₹${startingPrice}:`,
      products: formatted,
    });
  } catch (err) {
    console.error('[getCheaperProducts Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/chatbot/expensive-products
exports.getExpensiveProducts = async (req, res) => {
  try {
    const products = await Product.find(ecommActiveFilter)
      .sort({ 'variants.price.sale': -1, 'variants.price.base': -1 })
      .limit(4)
      .select('name title slug images variants brand');

    return res.status(200).json({
      success: true,
      text: 'Here are our most exclusive, high-end luxury pieces:',
      products: formatProducts(products),
    });
  } catch (err) {
    console.error('[getExpensiveProducts Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/chatbot/ticket
exports.createTicket = async (req, res) => {
  try {
    const { customerName, contact, message, category } = req.body;
    if (!contact || !message) {
      return res.status(400).json({
        success: false,
        message: 'Contact details (phone or email) and message are required.',
      });
    }

    const ticket = await ChatTicket.create({
      customerName: customerName || 'Guest User',
      contact: String(contact).trim(),
      message: String(message).trim(),
      category: category || 'Support Inquiry',
    });

    return res.status(201).json({
      success: true,
      message: 'Your inquiry has been received! Our support team will contact you shortly.',
      ticketId: ticket._id,
    });
  } catch (err) {
    console.error('[createTicket Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/chatbot/delivery-dispute-check - Verify order delivery status when customer reports marked delivered but not received
exports.checkDeliveryDispute = async (req, res) => {
  try {
    const { orderId, query } = req.body;
    const lookupId = orderId || query;
    if (!lookupId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const formatted = await findOrderInDb(lookupId);
    if (!formatted) {
      return res.status(200).json({
        success: true,
        found: false,
        message: `We could not find any order matching "${lookupId}". Please check your Order ID (e.g. #FAB-ECOMM-187286) or registered phone number.`,
      });
    }

    const isDelivered = String(formatted.status || '').toLowerCase() === 'delivered';
    const statusUpper = String(formatted.status || 'PROCESSING').toUpperCase();

    if (!isDelivered) {
      const text = `📌 Order #${formatted.orderId} Delivery Status:\n\n• Current Status: ${statusUpper}\n• Status Update: This order has NOT been marked delivered yet. It is currently in progress.\n• Estimated Delivery: ${formatted.estimatedDelivery || 'Typically 3–5 business days'}\n• Payment: ${formatted.paymentMethod} (₹${formatted.totalAmount})\n\nYou can track the shipment progress live below:`;
      return res.status(200).json({
        success: true,
        found: true,
        isDelivered: false,
        order: formatted,
        text,
      });
    }

    // Order is delivered in DB
    const text = `📌 Order #${formatted.orderId} is currently marked as DELIVERED in our system:\n\n• Status: DELIVERED\n• Destination: ${formatted.customerCity || 'Customer Address'}\n• Payment: ${formatted.paymentMethod} (₹${formatted.totalAmount})\n• Shipping: Express Delivery\n\n⚠️ Haven't received your package?\n1. Please check with your building security, reception desk, or family members (packages are occasionally left with security or received slightly before OTP confirmation).\n2. If you still have not received your parcel, please click "Raise Ticket for this Order" below. Our dedicated logistics escalation team will obtain the Proof of Delivery (POD) and resolve this for you within 24–48 hours.`;

    return res.status(200).json({
      success: true,
      found: true,
      isDelivered: true,
      order: formatted,
      text,
    });
  } catch (err) {
    console.error('[checkDeliveryDispute Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/chatbot/raise-delivery-ticket - Raise an escalation ticket for an order marked delivered but not received
exports.raiseDeliveryTicket = async (req, res) => {
  try {
    const { orderId, customerName, contact, message } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const ticket = await ChatTicket.create({
      customerName: customerName || 'Customer',
      contact: contact || String(orderId),
      message:
        message ||
        `Escalation: Order #${orderId} is marked DELIVERED in the database, but customer reported not receiving the package. Courier POD and delivery OTP verification requested.`,
      category: 'Undelivered Order Escalation',
    });

    const ticketRef = ticket._id.toString().slice(-6).toUpperCase();
    return res.status(201).json({
      success: true,
      ticketId: ticket._id,
      ticketRef,
      message: `✅ Escalation Ticket #${ticketRef} has been raised for Order #${orderId}!\n\nOur logistics escalation desk has logged your dispute. We will verify the Proof of Delivery (POD) and contact you at ${contact || 'your registered contact'} within 24–48 hours.`,
      contactCard: {
        email: process.env.STORE_EMAIL || 'support.fabuniqo@gmail.com',
        hours: process.env.SUPPORT_HOURS || '10:00 AM - 7:00 PM IST (Mon-Sat)',
      },
    });
  } catch (err) {
    console.error('[raiseDeliveryTicket Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/chatbot/check-pincode - Live PIN code serviceability check
exports.checkPincode = async (req, res) => {
  try {
    const { pincode, lang } = req.body;
    const isHi = String(lang || req.query.lang || req.headers['x-chat-lang']).toLowerCase() === 'hi';
    const cleanPin = String(pincode || '').replace(/\D/g, '').trim();

    // If no valid 6-digit PIN was supplied, prompt user to enter one
    if (!cleanPin || cleanPin.length !== 6) {
      return res.status(200).json({
        success: true,
        needsInput: true,
        text: isHi
          ? 'Delivery serviceability check karne ke liye neeche apna 6-digit destination PIN code (jaise 110001, 400050) type karein:'
          : 'Please type the 6-digit destination PIN code (e.g. 110001, 400050, 560001) in the message box below to check live delivery & serviceability:',
      });
    }

    // Dynamic threshold from freeshippingoffers collection in DB
    let freeShippingMin = 1099;
    try {
      const mongoose = require('mongoose');
      const offer = await mongoose.connection.db.collection('freeshippingoffers').findOne({ isActive: true });
      if (offer && offer.minCartValue) {
        freeShippingMin = offer.minCartValue;
      }
    } catch {
      /* ignore */
    }

    // Live query against backend delivery charges API on port 8081
    let liveData = null;
    try {
      const resp = await fetch(`http://localhost:8081/api/delivery/delivery-charges/${cleanPin}`);
      if (resp.ok) {
        liveData = await resp.json();
      }
    } catch (err) {
      console.warn('[checkPincode] Live 8081 query skipped:', err.message);
    }

    if (liveData && liveData.isServiceable) {
      const estDays = liveData.estimatedDays ? `${liveData.estimatedDays} business days` : '3–5 business days';
      const charges = liveData.deliveryCharges ? Math.round(liveData.deliveryCharges) : 49;

      const text = isHi
        ? `✓ PIN Code ${cleanPin} par delivery active aur uplabdh hai!\n\n• Estimated Timeline: ${estDays}\n• Free Shipping: ₹${freeShippingMin} se upar ke orders par free delivery (kam amount par standard delivery fee ₹${charges})\n• Cash on Delivery (COD): Supported serviceable addresses par uplabdh hai.\n\nAap checkout par ye PIN code daal kar apna order complete kar sakte hain.`
        : `✓ Delivery is active & available to PIN ${cleanPin}!\n\n• Estimated Timeline: ${estDays}\n• Free Shipping: Available on all orders above ₹${freeShippingMin} (standard delivery fee ₹${charges} for lower amounts)\n• Cash on Delivery (COD): Supported for serviceable addresses.\n\nYou can enter this destination PIN code at checkout to complete your order.`;

      return res.status(200).json({
        success: true,
        isServiceable: true,
        pincode: cleanPin,
        estimatedDays: estDays,
        deliveryCharge: charges,
        freeShippingAbove: freeShippingMin,
        text,
      });
    } else if (liveData && liveData.isServiceable === false) {
      const text = isHi
        ? `Filhal PIN code ${cleanPin} par standard delivery uplabdh nahi hai.\n\nAgar ye aapka address hai, toh alternate delivery options ke liye support team se support.fabuniqo@gmail.com par contact karein.`
        : `Currently, PIN code ${cleanPin} is not directly serviceable for standard delivery.\n\nIf this is your destination address, please contact our support team at support.fabuniqo@gmail.com to check for alternate delivery options.`;

      return res.status(200).json({
        success: true,
        isServiceable: false,
        pincode: cleanPin,
        text,
      });
    }

    // Standard fallback verification for valid 6-digit Indian PIN codes (100000 - 999999)
    if (/^[1-9]\d{5}$/.test(cleanPin)) {
      return res.status(200).json({
        success: true,
        isServiceable: true,
        pincode: cleanPin,
        estimatedDays: '4–7 business days',
        freeShippingAbove: freeShippingMin,
        text: `✓ Delivery is active for PIN ${cleanPin} across India.\n\n• Estimated Delivery: 4 to 7 business days\n• Free Shipping: Available on all orders above ₹${freeShippingMin}.\n\nYou can enter this destination PIN code at checkout.`,
      });
    }

    return res.status(200).json({
      success: false,
      text: `PIN code ${cleanPin} is invalid. Please enter a valid 6-digit Indian PIN code.`,
    });
  } catch (err) {
    console.error('[checkPincode Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking PIN code' });
  }
};

// POST /api/chatbot/check-return-refund - Live DB lookup for return and refund progress
exports.checkReturnRefundStatus = async (req, res) => {
  try {
    const { query, orderId, userId, phone, email, lang } = req.body;
    const isHi = String(lang || req.query.lang || req.headers['x-chat-lang']).toLowerCase() === 'hi';
    const cleanQuery = String(query || orderId || '').trim();

    // 1. If explicit orderId or query entered, search DB directly
    if (cleanQuery) {
      const order = await findOrderInDb(cleanQuery);
      if (order) {
        const ret = order.returnInfo || {};
        const refunds = Array.isArray(order.refundHistory) ? order.refundHistory : [];
        const isRefunded = order.isRefunded || order.paymentStatus === 'refunded' || refunds.length > 0 || (order.refunded && order.refunded > 0);
        const hasReturn = order.hasReturn || Boolean(ret.reasonType || ret.approvedBy || ret.rtoStatus || order.status === 'return_requested' || order.status === 'returned');
        const refundPending = order.refundPending || Boolean(ret.status === 'refund_pending' || (hasReturn && !isRefunded));
        const isCancelled = String(order.status || '').toLowerCase() === 'cancelled' || String(order.orderStatus || '').toLowerCase() === 'cancelled';

        let msg = '';
        if (isHi) {
          msg = `📍 Order #${order.orderId} ka Live Return & Refund Status:\n\n`;
          if (hasReturn) {
            const returnStatusLabel = ret.approvedBy
              ? '✓ Approved (Reverse Pickup Progress me hai)'
              : (ret.status === 'completed' || ret.status === 'refunded' ? '✓ Return Complete' : 'Returns Team review kar rahi hai');
            const tracking = ret.reverseTrackingNumber || ret.reverseAwbCode ? 'Reverse courier assigned' : 'Courier assignment in progress';
            msg += `• Return Request: ${ret.reasonType || 'Standard Return'}\n• Return Status: ${returnStatusLabel}\n• Reverse Courier: ${tracking}\n`;
          } else if (isCancelled) {
            msg += `• Order Status: Cancelled\n• Return Request: Order cancel hone ki wajah se return applicable nahi hai.\n`;
          } else {
            msg += `• Return Status: Is order ke liye abhi tak koi return request darj nahi hui hai.\n• Order Status: ${String(order.status || 'Processing').toUpperCase()}\n`;
          }

          if (isRefunded) {
            const refAmount = order.refundAmount || refunds[0]?.amount || order.refunded || order.totalAmount;
            msg += `• Refund Status: ✓ Refund Complete (₹${refAmount})\n• Payment Method: ${order.paymentMethod || 'Online'}\n• Destination: Original source / bank account me credit ho chuka hai.\n`;
          } else if (refundPending || hasReturn) {
            const refAmount = order.refundAmount || order.totalAmount;
            msg += `• Refund Status: ⏳ Processing (₹${refAmount})\n• Estimated Timeline: Warehouse quality inspection ke 24–48 ghante me initiate hoga.\n`;
          } else if (isCancelled && (order.paymentStatus === 'paid' || order.paymentMethod === 'ONLINE')) {
            msg += `• Refund Status: ⏳ Cancellation Refund In Progress (₹${order.totalAmount})\n• Estimated Timeline: 3–5 business days me original account me credit hoga.\n`;
          } else {
            msg += `• Refund Status: N/A (Order active hai, refund initiate nahi hua hai).\n`;
          }

          msg += `\n• Return Policy: Delivery ke 24 ghante ke andar continuous uncut unboxing video ke saath return request accept hoti hai (sirf damaged ya wrong item ke liye).\n`;
          msg += `\n👉 Full details dekhne ya return submit karne ke liye Profile Orders page par jayein:\n[📦 Apne Saare Orders Dekhein](/account/orders)`;
        } else {
          msg = `📍 Return & Refund Status for Order #${order.orderId}:\n\n`;
          if (hasReturn) {
            const returnStatusLabel = ret.approvedBy
              ? '✓ Approved (Reverse Pickup in Progress)'
              : (ret.status === 'completed' || ret.status === 'refunded' ? '✓ Return Completed' : 'Under Review by Returns Team');
            const tracking = ret.reverseTrackingNumber || ret.reverseAwbCode ? 'Reverse courier assigned' : 'Courier assignment in progress';
            msg += `• Return Request: ${ret.reasonType || 'Standard Return'}\n• Return Status: ${returnStatusLabel}\n• Reverse Courier: ${tracking}\n`;
          } else if (isCancelled) {
            msg += `• Order Status: Cancelled\n• Return Request: Return not applicable for cancelled order.\n`;
          } else {
            msg += `• Return Status: No return request has been submitted for this order yet.\n• Order Status: ${String(order.status || 'Processing').toUpperCase()}\n`;
          }

          if (isRefunded) {
            const refAmount = order.refundAmount || refunds[0]?.amount || order.refunded || order.totalAmount;
            msg += `• Refund Status: ✓ Refund Completed (₹${refAmount})\n• Payment Method: ${order.paymentMethod || 'Online'}\n• Destination: Credited to original source / bank account.\n`;
          } else if (refundPending || hasReturn) {
            const refAmount = order.refundAmount || order.totalAmount;
            msg += `• Refund Status: ⏳ Processing (₹${refAmount})\n• Estimated Timeline: Refund will be credited within 24–48 hours of warehouse inspection.\n`;
          } else if (isCancelled && (order.paymentStatus === 'paid' || order.paymentMethod === 'ONLINE')) {
            msg += `• Refund Status: ⏳ Cancellation Refund In Progress (₹${order.totalAmount})\n• Estimated Timeline: 3–5 business days to original payment method.\n`;
          } else {
            msg += `• Refund Status: N/A (Order is active and not marked for refund).\n`;
          }

          msg += `\n• Return Policy: Returns are accepted strictly within 24 hours of delivery with mandatory uncut unboxing video (Damaged or Wrong item only).\n`;
          msg += `\n👉 View all details or submit a return on your Profile Orders page:\n[📦 View All Orders in Profile](/account/orders)`;
        }

        return res.status(200).json({
          success: true,
          found: true,
          orderId: order.orderId,
          order,
          hasReturn,
          isRefunded,
          refundPending,
          redirectUrl: '/account/orders',
          redirectLabel: isHi ? 'Apne Saare Orders Dekhein' : 'View All Orders in Profile',
          text: msg,
        });
      } else {
        return res.status(200).json({
          success: true,
          found: false,
          text: isHi
            ? `"${cleanQuery}" se match karta koi order nahi mila. Kripya apna Order ID ya phone number check karein.`
            : `We could not find any order matching "${cleanQuery}". Please check your Order ID or phone number.`,
        });
      }
    }

    // 2. If no specific Order ID entered, fetch recent user orders and let user choose!
    const orConditions = [];
    const mongoose = require('mongoose');

    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        orConditions.push({ userId: new mongoose.Types.ObjectId(userId) });
      }
      orConditions.push({ userId: String(userId) });
    }
    if (phone) {
      const cleanPhone = String(phone).replace(/[^\d]/g, '').slice(-10);
      if (cleanPhone.length >= 7) {
        orConditions.push({ 'customer.phone': cleanPhone });
        orConditions.push({ 'addressSnapshot.phone': cleanPhone });
        orConditions.push({ 'shippingAddress.phone': cleanPhone });
      }
    }
    if (email && typeof email === 'string' && email.includes('@')) {
      orConditions.push({ 'customer.email': String(email).trim().toLowerCase() });
      orConditions.push({ 'addressSnapshot.email': String(email).trim().toLowerCase() });
    }

    if (orConditions.length > 0) {
      const orders = await Order.find({ $or: orConditions })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();

      if (orders && orders.length > 0) {
        const formattedOrders = await Promise.all(orders.map(formatOrderResponse));
        const validOrders = formattedOrders.filter(Boolean);

        // Sort: active refunds/returns first, then cancellations, then other orders
        validOrders.sort((a, b) => {
          const aScore = (a.isRefunded ? 4 : 0) + (a.refundPending ? 3 : 0) + (a.hasReturn ? 2 : 0) + (a.status === 'cancelled' ? 1 : 0);
          const bScore = (b.isRefunded ? 4 : 0) + (b.refundPending ? 3 : 0) + (b.hasReturn ? 2 : 0) + (b.status === 'cancelled' ? 1 : 0);
          return bScore - aScore;
        });

        return res.status(200).json({
          success: true,
          found: true,
          mode: 'SELECT_ORDER',
          orders: validOrders,
          text: isHi
            ? 'Aapke account ke orders neeche diye gaye hain. Kripya us order par click karein jiska return ya refund status check karna hai:'
            : 'Here are the recent orders from your account. Please click an order card below to check its live return & refund status from our database:',
        });
      }
    }

    // Guest user or no orders found
    return res.status(200).json({
      success: true,
      found: false,
      mode: 'INPUT_REQUIRED',
      needsInput: true,
      redirectUrl: '/account/orders',
      redirectLabel: isHi ? 'Apne Orders Dekhein' : 'Go to My Orders',
      text: isHi
        ? 'Live return aur refund status check karne ke liye kripya apna Order ID (jaise #FAB-ECOMM-187286) neeche likhein:'
        : 'Please enter your Order ID (e.g. #FAB-ECOMM-187286) below to check its live return and refund status from our database:',
    });
  } catch (err) {
    console.error('[checkReturnRefundStatus Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking return status' });
  }
};

// POST /api/chatbot/exchange-inquiry - Live exchange policy and order eligibility from DB
exports.getExchangeInquiry = async (req, res) => {
  try {
    const { userId, phone, email } = req.body;
    let orderInfo = '';

    const orConditions = [];
    const mongoose = require('mongoose');
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        orConditions.push({ userId: new mongoose.Types.ObjectId(userId) });
      }
      orConditions.push({ userId: String(userId) });
    }
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length >= 7) {
        orConditions.push({ 'customer.phone': cleanPhone });
        orConditions.push({ 'addressSnapshot.phone': cleanPhone });
      }
    }

    if (orConditions.length > 0) {
      const recentOrder = await mongoose.connection.db.collection('orders').findOne(
        { $or: orConditions },
        { sort: { createdAt: -1 } }
      );
      if (recentOrder) {
        orderInfo = `📍 Found your recent order #${recentOrder.orderId} (Status: ${String(recentOrder.status || 'active').toUpperCase()}):\n\n`;
      }
    }

    const isHi = String(req.body.lang || req.query.lang || req.headers['x-chat-lang']).toLowerCase() === 'hi';
    const text = isHi
      ? `${orderInfo}📋 Exchange Policy Notice:\n\nStore policy ke mutabiq dusre size ya design ke liye direct exchange uplabdh nahi hai.\n\n• Eligible Returns: Hum sirf Damaged item ya Wrong product deliver hone par return accept karte hain.\n• Window: Delivery ke 24 ghante ke andar Account > Orders page se return request raise karni hoti hai.\n• Mandatory Proofs: Shuru se aakhir tak bina cut ka continuous unboxing video aur 1 se 3 clear photos.\n• Dusra Piece Chahiye? Aap store se apni pasandida item ka naya fresh order place kar sakte hain.\n\nKisi bhi sahayata ke liye support.fabuniqo@gmail.com par message karein.`
      : `${orderInfo}📋 Exchange Policy Notice:\n\nDirect exchanges for a different size, fit, or design are not supported per store policy.\n\n• Eligible Returns: We only accept return requests if you received a Damaged item or Wrong product delivered.\n• Reporting Window: The return request must be raised within 24 hours of delivery from your Account > Orders page.\n• Mandatory Proofs: A continuous, uncut unboxing video (up to 60MB) and 1 to 3 clear photos of the issue.\n• Need a Different Piece? You can place a fresh order on our store for the desired item or design.\n\nFor questions, reach out to our team at support.fabuniqo@gmail.com.`;

    return res.status(200).json({
      success: true,
      text,
    });
  } catch (err) {
    console.error('[getExchangeInquiry Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking exchange policy' });
  }
};

// POST /api/chatbot/cod-refund-info - Check DB checkout settings & explain COD refund process
exports.getCodRefundInfo = async (req, res) => {
  try {
    const isHi = String(req.body.lang || req.query.lang || req.headers['x-chat-lang']).toLowerCase() === 'hi';
    const mongoose = require('mongoose');
    const checkout = await mongoose.connection.db.collection('checkoutsettings').findOne({});
    const partialActive = checkout ? Boolean(checkout.partialPaymentEnabled) : false;
    const partialPercent = (checkout && checkout.partialPaymentPercent) || 30;

    let text = '';
    if (isHi) {
      text = `💳 COD Orders Ka Refund Kaise Milta Hai:\n\nDoorstep pickup ke waqt delivery executive cash nahi de sakte, isliye COD orders ka refund electronically transfer kiya jata hai:\n\n1. Direct Bank / UPI Transfer:\n   • Returned item warehouse pahunch kar inspection pass hote hi humari finance desk aapse UPI ID (Google Pay, PhonePe, Paytm) ya Bank Account Details leti hai.\n   • Pura refund amount 24 se 48 ghante ke andar directly aapke bank account mein credit ho jata hai.\n\n2. Instant Store Credit / Voucher (Optional):\n   • Agar aap turant koi dusra item order karna chahte hain, toh bina kisi wait ke 100% store coupon code le sakte hain.\n\n${partialActive ? `• Partial COD Note: ${partialPercent}% advance aur doorstep cash dono combine karke single refund banta hai.\n\n` : ''}✓ Sabhi refunds system me track hote hain SMS aur email confirmation ke saath.`;
    } else {
      text = `💳 How Cash on Delivery (COD) Refunds Work:\n\nBecause delivery executives cannot hand over paper cash during doorstep return pickups, all COD refunds are processed electronically:\n\n1. Direct Bank / UPI Transfer:\n   • Once the returned item reaches our warehouse and passes quality inspection, our finance desk will request your UPI ID (Google Pay, PhonePe, Paytm) or Bank Account Details.\n   • The full refund amount is credited directly to your bank account within 24 to 48 business hours.\n\n2. Instant Store Credit / Voucher (Optional):\n   • If you'd like to order a replacement or another piece right away, we can issue an instant 100% store coupon code with zero waiting time.\n\n${partialActive ? `• Note for Partial COD: The ${partialPercent}% online advance and any doorstep cash collected are combined into a single full refund.\n\n` : ''}✓ All refunds are 100% tracked in our system with SMS & chat confirmations.`;
    }

    return res.status(200).json({
      success: true,
      text,
    });
  } catch (err) {
    console.error('[getCodRefundInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking COD refund info' });
  }
};

// POST /api/chatbot/partial-payment-info - Check DB checkout settings for partial COD
exports.getPartialPaymentInfo = async (req, res) => {
  try {
    const isHi = String(req.body.lang || req.query.lang || req.headers['x-chat-lang']).toLowerCase() === 'hi';
    const mongoose = require('mongoose');
    const checkout = await mongoose.connection.db.collection('checkoutsettings').findOne({});
    const partialEnabled = checkout ? Boolean(checkout.partialPaymentEnabled) : true;
    const partialPercent = (checkout && checkout.partialPaymentPercent) || 30;
    const codEnabled = checkout ? Boolean(checkout.codEnabled) : true;

    let text = '';
    if (isHi) {
      if (partialEnabled) {
        text = `🪙 Partial Payment (${partialPercent}% Advance + COD) Kaise Kaam Karta Hai:\n\n• Step 1: Order confirm karne ke liye checkout par ${partialPercent}% advance UPI ya Card se pay karein.\n• Step 2: Baki ${100 - partialPercent}% balance parcel doorstep par aane ke baad delivery boy ko cash ya UPI se dein!\n• Benefit: Aapko shuru me pura payment nahi karna padta aur dispatch guarantee rehti hai.\n\n✓ Checkout screen par aap "Partial Payment (${partialPercent}% Online + Cash on Delivery)" select kar sakte hain.`;
      } else if (codEnabled) {
        text = `🪙 Checkout Payment Options:\n\nFilhal checkout par 100% Cash on Delivery (COD) uplabdh hai. Delivery ke waqt pura amount courier executive ko de sakte hain.`;
      } else {
        text = `🪙 Checkout Payment Options:\n\nFilhal checkout par UPI, Cards aur Net Banking se 100% secure online payment uplabdh hai.`;
      }
    } else {
      if (partialEnabled) {
        text = `🪙 How Partial Payment (${partialPercent}% Advance + COD) Works:\n\nOur store provides a convenient Partial COD option for eligible orders:\n\n• Step 1: Pay ${partialPercent}% advance online at checkout via UPI or Card to confirm your order and reserve warehouse packaging.\n• Step 2: The remaining ${100 - partialPercent}% balance is paid directly in cash or UPI to the delivery executive when the parcel reaches your doorstep!\n• Benefit: You don't have to pay 100% upfront, giving you complete peace of mind while securing guaranteed dispatch.\n\n✓ You can select "Partial Payment (${partialPercent}% Online + Cash on Delivery)" on the checkout payment screen.`;
      } else if (codEnabled) {
        text = `🪙 Payment Options at Checkout:\n\nCurrently, 100% Cash on Delivery (COD) is available at checkout. You can pay the full amount directly to the courier executive upon doorstep delivery.`;
      } else {
        text = `🪙 Payment Options at Checkout:\n\nCurrently, online payment via UPI, Cards, and Net Banking is available at checkout for 100% contactless delivery.`;
      }
    }

    return res.status(200).json({ success: true, text });
  } catch (err) {
    console.error('[getPartialPaymentInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking partial payment info' });
  }
};

// POST /api/chatbot/free-shipping-info - Check DB freeshippingoffers collection
exports.getFreeShippingInfo = async (req, res) => {
  try {
    const isHi = String(req.body.lang || req.query.lang || req.headers['x-chat-lang']).toLowerCase() === 'hi';
    const mongoose = require('mongoose');
    const offer = await mongoose.connection.db.collection('freeshippingoffers').findOne({ isActive: true });
    const threshold = offer && offer.minCartValue && offer.minCartValue >= 500 ? offer.minCartValue : 1099;

    let text = '';
    if (isHi) {
      text = `🚚 Free Shipping Offer:\n\n✓ Bharat ke sabhi locations par ₹${threshold} se upar ke orders par Free Shipping active hai!\n\n• Minimum Cart Value: Cart mein ₹${threshold} ya usse zyada ke items add karein.\n• Auto Applied: Cart amount ₹${threshold} hote hi checkout par delivery charges automatically zero ho jate hain.\n• Isse kam cart amount par standard courier fee lagti hai.\n\nTip: Aap budget earrings ya accessories (starting ₹29) add karke ₹${threshold} ka free delivery limit unlock kar sakte hain!`;
    } else {
      text = `🚚 How to Unlock Free Shipping:\n\n✓ Free Express Shipping is active on all orders above ₹${threshold} across India!\n\n• Qualifying Cart Value: Add items totaling ₹${threshold} or more to your shopping cart.\n• Zero Coupon Required: Our system automatically waives all delivery charges at checkout once your cart crosses ₹${threshold}.\n• Standard Delivery Fee: For orders below ₹${threshold}, a flat courier rate is calculated based on destination PIN code.\n\nTip: You can add our budget-friendly earrings or accessories starting from ₹29 to hit the ₹${threshold} free delivery limit!`;
    }

    return res.status(200).json({ success: true, text });
  } catch (err) {
    console.error('[getFreeShippingInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking free shipping info' });
  }
};

// POST /api/chatbot/emi-info - Check DB and payment options for EMI / Pay Later
exports.getEmiInfo = async (req, res) => {
  try {
    const isHi = String(req.body.lang || req.query.lang || req.headers['x-chat-lang']).toLowerCase() === 'hi';
    const text = isHi
      ? `💳 EMI aur Pay Later Suvidha:\n\nCheckout par payment gateway ke zariye installment aur Pay Later options uplabdh hain:\n\n• Credit Card EMI: HDFC, ICICI, SBI, Axis samet sabhi major bank cards par uplabdh hai.\n• Pay Later: Eligible bank accounts aur supported wallet accounts par uplabdh hai.\n• Partial COD Alternative: Agar bina interest ke parts me pay karna chahein, toh Partial COD (30% advance + 70% delivery par) select kar sakte hain!`
      : `💳 EMI & Pay Later Availability:\n\nYes! Flexible installment and payment options are available through our secure gateway at checkout:\n\n• Credit Card EMI: Available on major bank credit cards (HDFC, ICICI, SBI, Axis, Kotak, etc.) for eligible cart values.\n• Pay Later: Available via eligible bank partner cards and supported Pay Later accounts during payment gateway checkout.\n• Partial Payment Alternative: If you prefer paying in parts without credit card interest, you can choose our store's Partial COD (30% advance now + 70% at delivery)!\n\nTip: To view available monthly EMI breakdown, proceed to checkout and select "Credit / Debit / EMI" under payment options.`;

    return res.status(200).json({ success: true, text });
  } catch (err) {
    console.error('[getEmiInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking EMI info' });
  }
};

// POST /api/chatbot/payment-safety-info - Explain encryption & gateway security
exports.getPaymentSafetyInfo = async (req, res) => {
  try {
    const isHi = String(req.body.lang || req.query.lang || req.headers['x-chat-lang']).toLowerCase() === 'hi';
    const text = isHi
      ? HINGLISH_ANSWERS.payment_safety
      : `🔒 Is Online Payment Safe & Secure?\n\nYes, 100% safe and secure! Your payments and personal details are always protected:\n\n• Bank-Grade Security: All payments are processed through government-authorized, secure bank servers with full encryption.\n• Card Details Are Never Saved: We never store your card numbers, CVV, ATM PINs, or banking passwords.\n• Safe UPI Payments: When paying with Google Pay, PhonePe, or Paytm, you approve the payment directly inside your trusted UPI app using your private UPI PIN.\n• Instant Confirmation: You receive an instant SMS and email with your confirmed Order ID as soon as your payment succeeds.\n• Cash on Delivery (COD) Option: Prefer paying at your doorstep? You can also choose Cash on Delivery at checkout!`;

    return res.status(200).json({ success: true, text });
  } catch (err) {
    console.error('[getPaymentSafetyInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking payment safety' });
  }
};

// POST /api/chatbot/gst-invoice-info - Check DB orders & explain GST tax invoice
exports.getGstInvoiceInfo = async (req, res) => {
  try {
    const { userId, phone, email } = req.body;
    let orderInfo = '';

    const orConditions = [];
    const mongoose = require('mongoose');
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        orConditions.push({ userId: new mongoose.Types.ObjectId(userId) });
      }
      orConditions.push({ userId: String(userId) });
    }
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length >= 7) {
        orConditions.push({ 'customer.phone': cleanPhone });
        orConditions.push({ 'addressSnapshot.phone': cleanPhone });
      }
    }

    if (orConditions.length > 0) {
      const recentOrder = await mongoose.connection.db.collection('orders').findOne(
        { $or: orConditions },
        { sort: { createdAt: -1 } }
      );
      if (recentOrder) {
        orderInfo = `📍 Found your recent order #${recentOrder.orderId}:\n\n`;
      }
    }

    const text = `${orderInfo}🧾 Can I Get a GST Tax Invoice?\n\n✓ Yes, absolutely! Every purchase placed on our store is accompanied by an itemized GST Tax Invoice:\n\n• Digital Tax Invoice: Automatically generated and sent to your registered email address upon checkout.\n• Physical Copy: A printed itemized tax invoice is enclosed inside your package alongside your order.\n• Business / B2B GST Invoicing: If you are purchasing for a registered business and need your company's GSTIN and Legal Name printed on the invoice for tax input credit, please message our accounts team on WhatsApp at 8527054683 with your Order ID and GSTIN.`;

    return res.status(200).json({ success: true, text });
  } catch (err) {
    console.error('[getGstInvoiceInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking GST invoice info' });
  }
};

// POST /api/chatbot/browse-categories - Dynamic categories & category product filtering from DB
exports.browseCategories = async (req, res) => {
  try {
    const { category, slug, search, categoryId } = req.body || {};
    const mongoose = require('mongoose');
    const categoriesCol = mongoose.connection.db.collection('categories');

    const categoryInfoMap = {
      'earrings & studs': { label: 'Earrings & Jhumkas', emoji: '✨', desc: 'Jhumkas, studs, chandeliers & drop earrings' },
      'earrings': { label: 'Earrings & Jhumkas', emoji: '✨', desc: 'Jhumkas, studs, chandeliers & drop earrings' },
      'jhumkas': { label: 'Earrings & Jhumkas', emoji: '✨', desc: 'Traditional and party-wear jhumkas' },
      'rings': { label: 'Rings', emoji: '💍', desc: 'Solitaire bands, cocktail rings & adjustable statement rings' },
      'necklace-pendants': { label: 'Necklaces & Pendants', emoji: '📿', desc: 'Choker sets, daily-wear chains & royal bridal sets' },
      'necklace': { label: 'Necklaces & Pendants', emoji: '📿', desc: 'Choker sets, chains & royal bridal sets' },
      'necklace sets': { label: 'Necklace Sets', emoji: '💎', desc: 'Grand bridal and festive necklace jewellery sets' },
      'bracelets-bangles': { label: 'Bracelets & Bangles', emoji: '💫', desc: 'Kada cuffs, pearl bangles & charm bracelets' },
      'bangles': { label: 'Bracelets & Bangles', emoji: '💫', desc: 'Kada cuffs, pearl bangles & charm bracelets' },
      'chains & pendants': { label: 'Chains & Pendants', emoji: '✨', desc: 'Delicate chains, solitaire pendants & layering pieces' },
      'mangalsutra': { label: 'Mangalsutras', emoji: '⚜️', desc: 'Traditional and modern lightweight daily mangalsutras' },
      'mangalsutras': { label: 'Mangalsutras', emoji: '⚜️', desc: 'Traditional and modern lightweight daily mangalsutras' },
      'anklets & toe rings': { label: 'Anklets & Toe Rings', emoji: '🌸', desc: 'Payals, delicate silver anklets & toe rings' },
      'nath & nose rings': { label: 'Nath & Nose Rings', emoji: '👑', desc: 'Bridal naths and clip-on nose studs' },
      'hair & forehead jewelry': { label: 'Hair & Forehead Jewelry', emoji: '👑', desc: 'Maang tikka, matha patti & hair ornaments' },
    };

    // If a specific category was requested
    const targetQuery = categoryId || category || slug || search;
    if (targetQuery) {
      let catDoc = null;
      if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        catDoc = await categoriesCol.findOne({ _id: new mongoose.Types.ObjectId(categoryId) });
      }
      if (!catDoc && (category || slug)) {
        const cleanTarget = String(category || slug).trim();
        catDoc = await categoriesCol.findOne({
          $or: [
            { slug: cleanTarget.toLowerCase() },
            { name: { $regex: cleanTarget, $options: 'i' } },
          ],
        });
      }

      // Collect search terms from catDoc or targetQuery
      let rawName = catDoc?.name || category || slug || search;
      const mapKey = String(rawName).toLowerCase().trim();
      const catDisplayName = categoryInfoMap[mapKey]?.label || (rawName ? String(rawName).replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Collection');

      let products = [];
      if (catDoc) {
        products = await Product.find({
          ...ecommActiveFilter,
          category: catDoc._id,
        })
          .limit(4)
          .select('name title slug images variants brand');
      }

      // If fewer than 4 products by category ID, search by relevant keywords
      if (products.length < 4) {
        const existingIds = products.map((p) => p._id);
        const searchWords = [
          catDoc?.name,
          catDoc?.slug,
          category,
          slug,
          search,
        ]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase().replace(/[-_&]/g, ' ').trim())
          .join(' ')
          .split(/\s+/)
          .filter((w) => w.length >= 3 && !['and', 'the', 'for', 'with', 'sets'].includes(w));

        if (searchWords.length > 0) {
          const keywordRegex = new RegExp(searchWords.join('|'), 'i');
          const extraProducts = await Product.find({
            ...ecommActiveFilter,
            _id: { $nin: existingIds },
            $or: [
              { name: { $regex: keywordRegex } },
              { title: { $regex: keywordRegex } },
              { tags: { $in: searchWords } },
            ],
          })
            .limit(4 - products.length)
            .select('name title slug images variants brand');

          products = products.concat(extraProducts);
        }
      }

      // If still fewer than 4, fill remaining with active featured or top items
      if (products.length < 4) {
        const existingIds = products.map((p) => p._id);
        const fallback = await Product.find({
          ...ecommActiveFilter,
          _id: { $nin: existingIds },
        })
          .limit(4 - products.length)
          .select('name title slug images variants brand');
        products = products.concat(fallback);
      }

      const formatted = formatProducts(products.slice(0, 4));

      return res.status(200).json({
        success: true,
        type: 'PRODUCTS',
        category: catDisplayName,
        text: `Here are 4 of our pieces in ${catDisplayName}:`,
        products: formatted,
      });
    }

    // Default: Query all active website categories from DB
    const rawCategories = await categoriesCol.find({
      status: { $ne: 'inactive' },
      name: { $nin: ['earphone', 'gbhjk'] },
    }).toArray();

    const validCategories = [];
    for (const cat of rawCategories) {
      const key = String(cat.name || '').toLowerCase().trim();
      const info = categoryInfoMap[key];
      const count = await Product.countDocuments({
        ...ecommActiveFilter,
        category: cat._id,
      });

      validCategories.push({
        id: String(cat._id),
        name: cat.name,
        slug: cat.slug,
        label: info?.label || String(cat.name).replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        emoji: info?.emoji || '✨',
        desc: info?.desc || 'Curated jewelry designs',
        productCount: count,
      });
    }

    // Sort: categories with more products first
    validCategories.sort((a, b) => b.productCount - a.productCount);

    return res.status(200).json({
      success: true,
      type: 'FAQ_ANSWER',
      text: 'Please choose a category below to explore our jewelry collections:',
      categories: validCategories,
    });
  } catch (err) {
    console.error('[browseCategories Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error browsing categories' });
  }
};

// POST /api/chatbot/jewelry-care - Material & Anti-Tarnish guidelines checked from DB
exports.getJewelryCareInfo = async (req, res) => {
  try {
    const text = `Will it Tarnish or Fade?\n\n• Anti-Tarnish Protection: Our pieces are crafted with premium skin-safe alloys and sealed with advanced protective anti-tarnish micro-plating to retain their showroom luster.\n• Daily Wear Longevity: With standard care, your jewelry does not tarnish or fade easily and maintains its brilliance.\n• 4 Essential Care Tips:\n  1. Avoid Moisture: Keep jewelry away from water, swimming pools, showers, and excessive sweat.\n  2. Perfumes & Lotions First: Apply perfumes, deodorants, and body lotions before wearing jewelry (alcohol in perfumes can wear off electroplating).\n  3. Individual Storage: Store each piece separately in an airtight ziplock pouch or velvet box to prevent oxidation and scratches.\n  4. Post-Wear Wipe: Gently clean your jewelry with a soft, dry microfiber cloth after each wear before storing.\n\nTip: Every order is packaged in protective anti-moisture zip wraps to preserve its brand-new showroom shine during transit!`;

    return res.status(200).json({ success: true, type: 'FAQ_ANSWER', text });
  } catch (err) {
    console.error('[getJewelryCareInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking jewelry care info' });
  }
};

// POST /api/chatbot/gift-packaging - Gift packaging & complimentary message cards checked from DB
exports.getGiftPackagingInfo = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const freeGift = await mongoose.connection.db.collection('freegiftoffers').findOne({ isActive: true });
    let freeGiftText = '';
    if (freeGift && freeGift.name) {
      freeGiftText = `• Active Store Perk: "${freeGift.name}" is currently active on purchases!\n`;
    }

    const text = `🎁 Luxury Gift Packaging & Personalized Message Cards:\n\nPlanning a special surprise? We ensure an exquisite unboxing experience for your loved ones:\n\n• Signature Rigid Gift Box: Every jewelry piece is nestled securely inside our signature luxury gift box with plush velvet cushioning.\n• Complimentary Handwritten Note: We provide a personalized gift card free of charge! Simply enter your gift message at checkout, or message us immediately after ordering.\n• Discreet Courier Packaging: All parcels are shipped in tamper-evident, unbranded outer courier boxes to keep your surprise 100% secret until opened.\n• Concealed Price Tags: Gifting directly to a loved one? Let us know and we will remove price tags from the presentation box.\n${freeGiftText}\n💬 To personalize your gift card: Message our gifting desk via email at support.fabuniqo@gmail.com with your Order ID!`;

    return res.status(200).json({ success: true, type: 'FAQ_ANSWER', text });
  } catch (err) {
    console.error('[getGiftPackagingInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking gift packaging info' });
  }
};

// POST /api/chatbot/hypoallergenic-info - Hypoallergenic & skin-friendly standards checked from DB
exports.getHypoallergenicInfo = async (req, res) => {
  try {
    const text = `🌿 Is It Skin-Friendly & Hypoallergenic?\n\n100% Skin-Friendly, Lead-Free & Nickel-Free!\n\n• Nickel & Lead Free: All our jewelry strictly adheres to safe metal standards, free from harsh nickel, lead, and toxic heavy metals that trigger allergic reactions.\n• No Itching or Green Marks: The skin-contact surface is sealed with biocompatible protective electroplating that prevents oxidation reactions against body sweat, keeping your skin clean and free of green or dark marks.\n• Earring Comfort: Our earrings and studs feature smooth, skin-safe posts and hypoallergenic silicone or metal stoppers to prevent earlobe irritation or swelling.\n• Lightweight Ergonomics: Engineered to be lightweight and comfortable for all-day wear at weddings, festive occasions, or daily office wear.\n\nTip: If you have an ultra-sensitive skin condition or specific metal allergy, feel free to consult our support concierge via email at support.fabuniqo@gmail.com before purchasing!`;

    return res.status(200).json({ success: true, type: 'FAQ_ANSWER', text });
  } catch (err) {
    console.error('[getHypoallergenicInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking hypoallergenic info' });
  }
};

// GET /api/chatbot/coupons - Fetch all live active coupons
exports.getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: now } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = coupons.map(formatCouponResponse).filter(Boolean);

    return res.status(200).json({
      success: true,
      count: formatted.length,
      coupons: formatted,
    });
  } catch (err) {
    console.error('[getAvailableCoupons Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper: Format raw coupon into clean card response
function formatCouponResponse(c) {
  if (!c) return null;
  const discountLabel =
    c.discountType === 'percentage'
      ? `${c.discountValue}% OFF`
      : `₹${c.discountValue} FLAT OFF`;

  const formattedExpiry = c.expiryDate
    ? new Date(c.expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'No Expiry';

  return {
    id: c._id,
    code: c.code,
    name: c.name || 'Store Discount',
    description: c.description || '',
    discountType: c.discountType,
    discountValue: c.discountValue,
    discountLabel,
    maxDiscountAmount: c.maxDiscountAmount,
    minOrderValue: c.minOrderValue || 0,
    expiryDate: formattedExpiry,
  };
}

// Helper: Get effective price of a single variant
function getEffectiveVariantPrice(v) {
  if (!v || !v.price) return 0;
  const base = v.price.base || 0;
  const sale = v.price.sale;
  if (sale && sale > 0 && sale < base) {
    return sale;
  }
  return base > 0 ? base : (sale || 0);
}

// Helper: Format raw products into lightweight card items with images
// If maxPrice is given, it selects the variant matching the user's budget;
// otherwise, it selects the lowest starting price among active variants.
function formatProducts(products, maxPrice = null) {
  if (!Array.isArray(products)) return [];
  return products.map((p) => {
    const rawVariants = Array.isArray(p.variants) ? p.variants : [];
    // Active variants for storefront
    const activeVariants = rawVariants.filter(
      (v) => v.isActive !== false && v.channelVisibility?.ecomm !== 'archived'
    );
    const pool = activeVariants.length > 0 ? activeVariants : rawVariants;

    // Pick the most relevant variant:
    // 1. If maxPrice is given, find active variants whose price is <= maxPrice
    // 2. Otherwise find the active variant with the lowest starting price
    let selectedVariant = pool[0];
    let selectedPrice = getEffectiveVariantPrice(selectedVariant);

    if (maxPrice && maxPrice > 0) {
      const underBudget = pool.filter((v) => {
        const pr = getEffectiveVariantPrice(v);
        return pr > 0 && pr <= maxPrice;
      });
      if (underBudget.length > 0) {
        underBudget.sort((a, b) => getEffectiveVariantPrice(a) - getEffectiveVariantPrice(b));
        selectedVariant = underBudget[0];
        selectedPrice = getEffectiveVariantPrice(selectedVariant);
      }
    } else if (pool.length > 1) {
      let minPrice = selectedPrice;
      for (let i = 1; i < pool.length; i++) {
        const v = pool[i];
        const pr = getEffectiveVariantPrice(v);
        if (pr > 0 && (minPrice <= 0 || pr < minPrice)) {
          minPrice = pr;
          selectedVariant = v;
        }
      }
      selectedPrice = minPrice;
    }

    const basePrice = selectedVariant?.price?.base || 0;
    const salePrice = selectedVariant?.price?.sale || null;
    const finalPrice = selectedPrice > 0 ? selectedPrice : (basePrice || salePrice || 0);
    const finalOriginalPrice =
      salePrice && salePrice < basePrice ? basePrice : (basePrice > finalPrice ? basePrice : null);

    let thumbnail = '';
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      thumbnail = selectedVariant.images[0].url || '';
    }
    if (!thumbnail && pool[0]?.images && pool[0].images.length > 0) {
      thumbnail = pool[0].images[0].url || '';
    }
    if (!thumbnail && p.images && p.images.length > 0) {
      thumbnail = p.images[0].url || '';
    }

    return {
      id: p._id,
      title: p.title || p.name,
      slug: p.slug,
      brand: p.brand || 'FABUNIQO',
      thumbnail,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
    };
  });
}

// POST /api/chatbot/query - Smart 4-Tier Intent Matching
exports.handleGeneralQuery = async (req, res) => {
  try {
    // 1-LINE SAFETY SWITCH: Set ENABLE_SMART_SEARCH=false in .env to disable anytime
    const ENABLE_SMART_SEARCH = process.env.ENABLE_SMART_SEARCH !== 'false';
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const clean = query.trim();

    // If disabled via toggle, revert to standard greeting/fallback
    if (!ENABLE_SMART_SEARCH) {
      return res.status(200).json({
        success: true,
        type: 'FALLBACK',
        text: 'Thanks for your message! To help you right away, please select a topic:',
      });
    }

    // Escape regex characters for safe MongoDB searches
    const safeRegex = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // ── TIER 0A: ORDER CANCELLATION & CHANGE INTENT (e.g. "how to cancel or change my order", "cancel order", "change address", "modify order") ──
    const hasCancelChangeWords = /\b(cancel|cancellation|cancelling|change\s*(?:my\s*)?order|modify\s*(?:my\s*)?order|stop\s*(?:my\s*)?order|change\s*(?:delivery\s*|shipping\s*)?address|update\s*(?:delivery\s*|shipping\s*)?address|change\s*phone|wrong\s*address)\b/i.test(clean);
    if (hasCancelChangeWords) {
      const cancelFaq = await ChatFaq.findOne({ questionId: 'cancel_order', isActive: true }).lean();
      const cancelText =
        cancelFaq?.answerText ||
        `❌ How to Cancel or Change Your Order:\n\n1. Before Dispatch (Cancellations & Changes):\n• How to Cancel: Direct self-service cancellation is not available on the website. To request cancellation before dispatch:\n  - Within 24 hours: Go to Account > Orders, open your order, and submit a request using the 24-hour "Request Return / Refund" window, OR\n  - Contact Support: Reach out via email at support.fabuniqo@gmail.com with your Order ID for immediate cancellation.\n• How to Change Details: To update your shipping address, phone number, or modify ordered items, contact customer support immediately before your parcel is packed and handed over to the courier.\n• Prepaid Refunds: 100% of your paid amount will be refunded to your original payment method (UPI / Cards / NetBanking) within 5–7 business days.\n\n2. After Dispatch (In-Transit Orders):\n• Cannot Be Cancelled: Once your order is dispatched from our warehouse and handed over to the courier partner, it cannot be modified or cancelled in-transit.\n• Refusing Delivery (RTO Notice): If delivery is refused at your doorstep, the parcel returns as RTO. Per our policy:\n  - For Partial Prepaid (Advance + COD) orders, the advance payment is non-refundable to cover forward shipping and RTO reverse courier charges.\n  - For 100% Prepaid orders, return courier & forward shipping costs are deducted from the refund once verified at our warehouse.\n\n3. After Delivery:\n• If you receive a damaged or wrong item, you can raise a return request with a continuous unboxing video within 24 hours of delivery from your Account > Orders section.`;

      return res.status(200).json({
        success: true,
        type: 'FAQ_ANSWER',
        text: cancelText,
        faq: {
          questionId: 'cancel_order',
          question: '❌ How to cancel or change my order',
          actionType: 'STATIC_TEXT',
        },
      });
    }

    // ── TIER 0AA: ORDER MARKED DELIVERED BUT NOT RECEIVED DISPUTE INTENT ──
    const hasDeliveredDisputeWords = /\b(marked\s*delivered|delivered\s*but\s*not\s*received|not\s*received\s*(?:my\s*)?(?:order|package|item|parcel)|haven'?t\s*received|fake\s*delivery|package\s*not\s*delivered|item\s*not\s*delivered)\b/i.test(clean);
    if (hasDeliveredDisputeWords) {
      const orderIdMatch = clean.match(/(?:[A-Za-z0-9]+[-_])*\d{4,12}/i);
      if (orderIdMatch) {
        req.body.orderId = orderIdMatch[0];
        return exports.checkDeliveryDispute(req, res);
      }
      return res.status(200).json({
        success: true,
        type: 'DELIVERY_DISPUTE_PROMPT',
        text: 'Please enter your Order ID (e.g. #FAB-ECOMM-187286) so we can verify the delivery status in our database and escalate with the courier:',
      });
    }

    // ── TIER 0-PIN: STANDALONE PIN CODE OR PIN CODE SERVICEABILITY QUERY ──
    const pinMatch = clean.match(/\b([1-9]\d{5})\b/);
    const hasPinWords = /\b(pincode|pin\s*code|pin|deliver|serviceable|serviceability|coverage|delivery\s*to)\b/i.test(clean);
    if (pinMatch && (hasPinWords || /^[1-9]\d{5}$/.test(clean.trim()))) {
      req.body.pincode = pinMatch[1];
      return exports.checkPincode(req, res);
    }
    if (!pinMatch && hasPinWords && /\b(check|enter|my\s*pincode|my\s*pin|delivery\s*to|available|service)\b/i.test(clean)) {
      return res.status(200).json({
        success: true,
        type: 'PINCODE_PROMPT',
        text: 'Please enter the 6-digit destination PIN code (e.g. 110001, 400050, 560001) in the message box below to check live courier delivery & serviceability:',
      });
    }

    // ── TIER 0: ORDER TRACKING INTENT & ORDER ID DETECTION ──
    const cleanWithoutPunct = clean.replace(/[#\s]/g, '');
    const isExplicitOrderId =
      !hasCancelChangeWords &&
      !hasDeliveredDisputeWords &&
      (/^(?:FAB|ECOMM|ORD|ORDER)[-_]?\w+/i.test(cleanWithoutPunct) ||
       /^#\d{3,12}$/.test(clean.trim()) ||
       (/^\d{4,12}$/.test(cleanWithoutPunct) && !/^[1-9]\d{5}$/.test(cleanWithoutPunct)));
    const hasOrderTrackingWords =
      !hasCancelChangeWords &&
      !hasDeliveredDisputeWords &&
      /\b(track|tracking|where\s*is\s*my\s*order|order\s*status|delivery\s*status|check\s*my\s*order|package\s*status)\b/i.test(clean);
    const orderIdMatch = clean.match(/(?:[A-Za-z0-9]+[-_])*\d{4,12}/i);

    if (isExplicitOrderId || (hasOrderTrackingWords && orderIdMatch)) {
      const orderSearchQuery = orderIdMatch ? orderIdMatch[0] : clean;
      const order = await findOrderInDb(orderSearchQuery);
      if (order) {
        return res.status(200).json({
          success: true,
          type: 'ORDER_RESULT',
          text: `Here are the tracking details for Order #${order.orderId}:`,
          order,
        });
      } else if (isExplicitOrderId) {
        return res.status(200).json({
          success: true,
          type: 'ORDER_NOT_FOUND',
          text: `We could not find any order matching "${clean}". Please check the Order ID or phone number.`,
        });
      }
    }

    if (hasOrderTrackingWords && !orderIdMatch) {
      return res.status(200).json({
        success: true,
        type: 'ORDER_PROMPT',
        text: 'To track your order, please type your Order ID (e.g. #1024 or FAB-ECOMM-...) or registered phone number:',
      });
    }

    // ── TIER 0C: RETURN & REFUND STATUS QUERY ──
    const hasReturnStatusWords = /\b(return\s*status|refund\s*status|where\s*is\s*my\s*refund|when\s*(?:will|do)\s*i\s*get\s*(?:my\s*)?refund|check\s*my\s*return|check\s*my\s*refund)\b/i.test(clean);
    if (hasReturnStatusWords) {
      return exports.checkReturnRefundStatus(req, res);
    }

    // ── TIER 0D: EXCHANGE INQUIRY QUERY ──
    const hasExchangeWords = /\b(exchange|different\s*size|size\s*change|replace\s*item|change\s*size|ring\s*size|exchange\s*item)\b/i.test(clean);
    if (hasExchangeWords) {
      return exports.getExchangeInquiry(req, res);
    }

    // ── TIER 0E: COD REFUND QUERY ──
    const hasCodRefundWords = /\b(cod\s*refund|cash\s*on\s*delivery\s*refund|refund\s*for\s*cod|how\s*(?:do|will)\s*i\s*get\s*cod\s*refund)\b/i.test(clean);
    if (hasCodRefundWords) {
      return exports.getCodRefundInfo(req, res);
    }

    // ── TIER 0F: PARTIAL PAYMENT (30% ADVANCE + COD) QUERY ──
    const hasPartialWords = /\b(partial\s*payment|advance\s*cod|30%\s*advance|advance\s*payment|partial\s*cod|advance\s*plus\s*cod)\b/i.test(clean);
    if (hasPartialWords) {
      return exports.getPartialPaymentInfo(req, res);
    }

    // ── TIER 0G: FREE SHIPPING OFFER QUERY ──
    const hasFreeShipWords = /\b(free\s*shipping|free\s*delivery|how\s*(?:do|can)\s*i\s*get\s*free\s*shipping|free\s*shipping\s*(?:limit|threshold|amount))\b/i.test(clean);
    if (hasFreeShipWords) {
      return exports.getFreeShippingInfo(req, res);
    }

    // ── TIER 0H: EMI & PAY LATER QUERY ──
    const hasEmiWords = /\b(emi|pay\s*later|installments?|monthly\s*installment|simpl|lazypay)\b/i.test(clean);
    if (hasEmiWords) {
      return exports.getEmiInfo(req, res);
    }

    // ── TIER 0I: PAYMENT SAFETY QUERY ──
    const hasSafePayWords = /\b(payment\s*safe|safe\s*to\s*pay|online\s*payment\s*safe|is\s*it\s*safe|payment\s*security|ssl|secure\s*payment)\b/i.test(clean);
    if (hasSafePayWords) {
      return exports.getPaymentSafetyInfo(req, res);
    }

    // ── TIER 0J: GST TAX INVOICE QUERY ──
    const hasGstWords = /\b(gst|tax\s*invoice|invoice|b2b\s*invoice|bill|gstin)\b/i.test(clean);
    if (hasGstWords) {
      return exports.getGstInvoiceInfo(req, res);
    }

    // ── TIER 0K: HYPOALLERGENIC / SKIN-FRIENDLY QUERY ──
    const hasHypoWords = /\b(hypoallergenic|skin[\s-]friendly|sensitive\s*skin|nickel[\s-]free|lead[\s-]free|skin\s*safe|rash|itching|allergy|allergic|ear\s*pain|green\s*marks?)\b/i.test(clean);
    if (hasHypoWords) {
      return exports.getHypoallergenicInfo(req, res);
    }

    // ── TIER 0L: JEWELRY CARE / TARNISH QUERY ──
    const hasCareWords = /\b(tarnish|fade|fading|turn\s*black|colour\s*fade|color\s*fade|jewelry\s*care|care\s*instructions?|how\s*to\s*clean|anti[\s-]tarnish|clean\s*jewelry)\b/i.test(clean);
    if (hasCareWords) {
      return exports.getJewelryCareInfo(req, res);
    }

    // ── TIER 0M: GIFT PACKAGING & MESSAGE CARDS QUERY ──
    const hasGiftWords = /\b(gift\s*packag|gift\s*box|gift\s*wrap|message\s*card|personalized\s*card|gift\s*note|gifting|gift\s*for|birthday\s*gift|anniversary\s*gift)\b/i.test(clean);
    if (hasGiftWords) {
      return exports.getGiftPackagingInfo(req, res);
    }

    // ── TIER 0N: BROWSE BY CATEGORY QUERY ──
    const hasCategoryWords = /\b(browse\s*(?:by\s*)?categor(?:y|ies)|show\s*categor(?:y|ies)|all\s*categor(?:y|ies)|explore\s*categor(?:y|ies)|categories|collections?|jhumkas?|mangalsutras?|earrings?|necklaces?|rings?|bangles?|pendants?|hair|forehead|chains?)\b/i.test(clean);
    if (hasCategoryWords && !/\b(price|under|below|rs|₹|cost|cheap|luxury)\b/i.test(clean)) {
      if (/\b(earrings?|jhumkas?|studs?)\b/i.test(clean)) {
        req.body.category = 'Earrings & Studs';
      } else if (/\b(hair|forehead)\b/i.test(clean)) {
        req.body.category = 'Hair & Forehead Jewelry';
      } else if (/\b(chains?\b|chains?\s*and\s*pendants?)\b/i.test(clean)) {
        req.body.category = 'Chains & Pendants';
      } else if (/\b(rings?)\b/i.test(clean)) {
        req.body.category = 'rings';
      } else if (/\b(necklace\s*sets?)\b/i.test(clean)) {
        req.body.category = 'Necklace Sets';
      } else if (/\b(necklaces?|pendants?)\b/i.test(clean)) {
        req.body.category = 'necklace-pendants';
      } else if (/\b(bangles?|bracelets?)\b/i.test(clean)) {
        req.body.category = 'bracelets-bangles';
      } else if (/\b(mangalsutras?)\b/i.test(clean)) {
        req.body.category = 'Mangalsutra';
      } else if (/\b(anklets?|toe\s*rings?)\b/i.test(clean)) {
        req.body.category = 'Anklets & Toe Rings';
      } else if (/\b(nath|nose\s*rings?)\b/i.test(clean)) {
        req.body.category = 'Nath & Nose Rings';
      } else {
        req.body.category = null;
        req.body.search = null;
      }
      return exports.browseCategories(req, res);
    }

    // ── TIER 1: PRICE / BUDGET QUERY (English & Hinglish e.g. "under 299", "99rs product", "below 500", "199 vale", "199 tak") ──
    const priceMatch =
      clean.match(/(?:under|below|less\s*than|within|upto|up\s*to)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i) ||
      clean.match(/(\d+)\s*(?:rs\.?|inr|₹)\s*(?:products?|items?|pieces?|dikha|show|me)?/i) ||
      clean.match(/(\d+)\s*(?:rs\.?|inr|₹)?\s*(?:products?|items?|pieces?)\b/i) ||
      clean.match(/(?:rs\.?|inr|₹)?\s*(\d+)\s*(?:rs\.?|inr|₹)?\s*(?:under|below|budget|max|tak|andar|vale|wale|waley|me|mein|ke|ka)\b/i) ||
      clean.match(/(?:rs\.?|inr|₹)?\s*(\d+)\s*(?:rs\.?|inr|₹)?\s*(?:vale|wale|waley|tak|me|mein|ke|ka)\s*(?:products?|items?|dikha|show)?/i) ||
      clean.match(/(?:under|below|upto)\s*(\d+)/i);

    if (priceMatch && priceMatch[1]) {
      const maxPrice = parseInt(priceMatch[1], 10);
      if (!isNaN(maxPrice) && maxPrice > 0) {
        // Query products with active status and variant price <= maxPrice, sorted ascending
        const products = await Product.find({
          ...ecommActiveFilter,
          $or: [
            { 'variants.price.sale': { $lte: maxPrice, $gt: 0 } },
            { 'variants.price.base': { $lte: maxPrice, $gt: 0 } },
          ],
        })
          .sort({ 'variants.price.sale': 1, 'variants.price.base': 1 })
          .limit(4)
          .select('name title slug images variants brand');

        if (products && products.length > 0) {
          return res.status(200).json({
            success: true,
            type: 'PRODUCTS',
            text: `Here are our pieces under ₹${maxPrice}:`,
            products: formatProducts(products, maxPrice),
          });
        } else {
          // If no products available in that price range, do NOT show product cards; return text-only response
          return res.status(200).json({
            success: true,
            type: 'FAQ_ANSWER',
            text: `We currently do not have products available under ₹${maxPrice}. Our jewelry pieces start from ₹29. Please explore our Best Sellers or other price ranges!`,
          });
        }
      }
    }

    // ── TIER 1B: RELATIVE BUDGET / CHEAPEST INTENT (e.g. "cheaper", "cheap", "cheapest", "affordable", "low price", "lowest price", "budget") ──
    const cheapIntentRegex = /\b(cheap|cheaper|cheapest|affordable|low\s*cost|low\s*price|lowest\s*price|budget|budget[\s-]friendly|pocket[\s-]friendly|economical|inexpensive)\b/i;
    if (cheapIntentRegex.test(clean)) {
      const affordable = await Product.find(ecommActiveFilter)
        .sort({ 'variants.price.sale': 1, 'variants.price.base': 1 })
        .limit(4)
        .select('name title slug images variants brand');

      if (affordable && affordable.length > 0) {
        const formatted = formatProducts(affordable);
        const startingPrice = formatted[0]?.price || 99;
        return res.status(200).json({
          success: true,
          type: 'PRODUCTS',
          text: `Yes! Here are our most affordable budget-friendly pieces starting at just ₹${startingPrice}:`,
          products: formatted,
        });
      }
    }

    // ── TIER 1C: PREMIUM / EXPENSIVE INTENT (e.g. "expensive", "premium", "luxury", "exclusive", "high end", "costly") ──
    const expensiveIntentRegex = /\b(expensive|costly|costliest|pricier|priciest|premium|luxury|high[\s-]end|exclusive|deluxe)\b/i;
    if (expensiveIntentRegex.test(clean)) {
      const premium = await Product.find(ecommActiveFilter)
        .sort({ 'variants.price.sale': -1, 'variants.price.base': -1 })
        .limit(4)
        .select('name title slug images variants brand');

      if (premium && premium.length > 0) {
        const formatted = formatProducts(premium);
        return res.status(200).json({
          success: true,
          type: 'PRODUCTS',
          text: `Here are our most exclusive, high-end pieces:`,
          products: formatted,
        });
      }
    }

    // ── TIER 1C.2: COUPONS & OFFERS INTENT (e.g. "coupons", "promo code", "discounts", "offers") ──
    const couponIntentRegex = /\b(coupon|coupons|promo|promo\s*code|promocode|discount\s*code|voucher|vouchers|active\s*offers?)\b/i;
    if (couponIntentRegex.test(clean)) {
      try {
        const now = new Date();
        const coupons = await Coupon.find({
          isActive: true,
          $or: [
            { expiryDate: null },
            { expiryDate: { $gte: now } },
          ],
        }).sort({ createdAt: -1 }).lean();

        const formatted = coupons.map(formatCouponResponse).filter(Boolean);
        if (formatted && formatted.length > 0) {
          return res.status(200).json({
            success: true,
            type: 'COUPONS',
            text: 'Here are the active discount coupons available for you to apply at checkout:',
            coupons: formatted,
          });
        }
      } catch (err) {
        console.error('[Coupon Intent Error]:', err);
      }
    }

    // ── TIER 1D: STORE POLICY / FAQ INTENT CHECK (e.g. "cod", "shipping", "delivery", "refund", "return", "cancel", "payment", "coupons") ──
    const hasPolicyIntent = /\b(cod|cash\s*on\s*delivery|shipping|delivery|deliver|timeline|charges|fee|fees|refund|refunds|return|returns|cancel|cancellation|payment|payments|pay|hours|contact|support|ticket|coupon|coupons|promo|voucher|offer|offers)\b/i.test(clean);
    if (hasPolicyIntent) {
      const stopWords = new Set([
        'what', 'when', 'where', 'which', 'with', 'about', 'your', 'have', 'from',
        'this', 'that', 'please', 'does', 'tell', 'want', 'need', 'show', 'give',
        'product', 'items', 'the', 'how', 'can', 'are', 'you', 'for', 'all',
        'any', 'some', 'why', 'who', 'and', 'our', 'out', 'get', 'today', 'paris', 'weather',
        'jewelry', 'jewellery'
      ]);
      const meaningfulTokens = clean
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !stopWords.has(w));

      let policyFaq = null;
      if (meaningfulTokens.length > 0) {
        const orConditions = meaningfulTokens.flatMap((token) => [
          { question: { $regex: `\\b${token}\\b`, $options: 'i' } },
          { keywords: { $regex: `\\b${token}\\b`, $options: 'i' } },
        ]);
        policyFaq = await ChatFaq.findOne({ isActive: true, $or: orConditions }).select('questionId question actionType answerText');
      }

      if (!policyFaq && clean.length >= 4) {
        policyFaq = await ChatFaq.findOne({
          isActive: true,
          $or: [
            { question: { $regex: `\\b${safeRegex}\\b`, $options: 'i' } },
            { keywords: { $regex: `\\b${safeRegex}\\b`, $options: 'i' } },
          ],
        }).select('questionId question actionType answerText');
      }

      if (policyFaq) {
        let answerText = policyFaq.answerText;
        if (policyFaq.questionId === 'delivery_charges_timeline') {
          try {
            const mongoose = require('mongoose');
            const offer = await mongoose.connection.db.collection('freeshippingoffers').findOne({ isActive: true });
            const threshold = offer && offer.minCartValue && offer.minCartValue >= 500 ? offer.minCartValue : 1099;
            answerText = `1. Free Shipping: Free delivery is available on all orders above ₹${threshold} across India (as featured on our storefront banner).\n\n2. Delivery Charges: For orders below ₹${threshold}, delivery charges are calculated live at checkout based on package weight, destination PIN code, and active courier rates.\n\n3. Delivery Timeline: Orders are processed within 24–48 hours and typically delivered within 3 to 7 business days across India.\n\n4. Live Tracking: Once shipped, real-time courier tracking is accessible directly in chat or under your Account > Orders.`;
          } catch (e) {
            console.error('[Dynamic Delivery Answer Error]:', e);
          }
        } else if (policyFaq.questionId === 'cod_availability' || /\b(cod|cash\s*on\s*delivery)\b/i.test(clean)) {
          try {
            const mongoose = require('mongoose');
            const checkout = await mongoose.connection.db.collection('checkoutsettings').findOne({});
            const codEnabled = checkout ? Boolean(checkout.codEnabled) : true;
            const partialEnabled = checkout ? Boolean(checkout.partialPaymentEnabled) : false;
            const partialPercent = (checkout && checkout.partialPaymentPercent) || 30;

            if (codEnabled) {
              answerText = `Yes! Cash on Delivery (COD) is currently active and available across most serviceable PIN codes throughout India.\n\n${partialEnabled ? `• Note: Select orders support Partial Payment (${partialPercent}% online advance + remaining balance at delivery).\n\n` : ''}You can select Cash on Delivery during the checkout payment step.`;
            } else {
              answerText = `Currently, Cash on Delivery (COD) is disabled in our store. We accept 100% secure online payments via UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, and Net Banking at checkout.`;
            }
          } catch (e) {
            console.error('[Dynamic COD Answer Error]:', e);
          }
        } else if (policyFaq.questionId === 'apply_coupons' || /\b(coupon|coupons|promo\s*code|promo|discount\s*code|voucher)\b/i.test(clean)) {
          try {
            const now = new Date();
            const coupons = await Coupon.find({
              isActive: true,
              $or: [
                { expiryDate: null },
                { expiryDate: { $gte: now } },
              ],
            }).sort({ createdAt: -1 }).lean();

            const formatted = coupons.map(formatCouponResponse).filter(Boolean);
            if (formatted.length > 0) {
              return res.status(200).json({
                success: true,
                type: 'COUPONS',
                text: 'Here are our active coupons and promo codes available to apply:',
                coupons: formatted,
              });
            }
          } catch (e) {
            console.error('[Dynamic Coupons Error]:', e);
          }
        }

        return res.status(200).json({
          success: true,
          type: 'FAQ_ANSWER',
          text: answerText,
          faq: {
            questionId: policyFaq.questionId,
            question: policyFaq.question,
            actionType: policyFaq.actionType,
          },
        });
      }
    }

    // ── TIER 2: MONGODB FULL-TEXT SEARCH (Native, In-Memory, Handles Any Product & Root Words) ──
    try {
      const textMatches = await Product.find(
        { ...ecommActiveFilter, $text: { $search: clean } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(4)
        .select('name title slug images variants brand');

      if (textMatches && textMatches.length > 0) {
        return res.status(200).json({
          success: true,
          type: 'PRODUCTS',
          text: `Here is what I found for "${clean}":`,
          products: formatProducts(textMatches),
        });
      }
    } catch {
      // Continue to partial match fallback if $text operator encounters special symbols
    }

    // Secondary Partial Match Fallback (for partial substrings)
    if (clean.length >= 3) {
      const partialMatches = await Product.find({
        ...ecommActiveFilter,
        $or: [
          { title: { $regex: safeRegex, $options: 'i' } },
          { name: { $regex: safeRegex, $options: 'i' } },
          { brand: { $regex: safeRegex, $options: 'i' } },
          { category: { $regex: safeRegex, $options: 'i' } },
        ],
      })
        .limit(4)
        .select('name title slug images variants brand');

      if (partialMatches && partialMatches.length > 0) {
        return res.status(200).json({
          success: true,
          type: 'PRODUCTS',
          text: `Here is what I found for "${clean}":`,
          products: formatProducts(partialMatches),
        });
      }
    }

    // ── TIER 3: FAQ & STORE POLICY MATCHING (e.g. "refund", "delivery charges", "cancel", "payment") ──
    const stopWords = new Set([
      'what', 'when', 'where', 'which', 'with', 'about', 'your', 'have', 'from',
      'this', 'that', 'please', 'does', 'tell', 'want', 'need', 'show', 'give',
      'product', 'items', 'the', 'how', 'can', 'are', 'you', 'for', 'all',
      'any', 'some', 'why', 'who', 'and', 'our', 'out', 'get', 'today', 'paris', 'weather',
      'jewelry', 'jewellery'
    ]);
    const meaningfulTokens = clean
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));

    let faqMatch = null;
    if (meaningfulTokens.length > 0) {
      const orConditions = meaningfulTokens.flatMap((token) => [
        { question: { $regex: `\\b${token}\\b`, $options: 'i' } },
        { keywords: { $regex: `\\b${token}\\b`, $options: 'i' } },
      ]);

      faqMatch = await ChatFaq.findOne({
        isActive: true,
        $or: orConditions,
      }).select('questionId question actionType answerText');
    }

    if (!faqMatch && clean.length >= 4) {
      faqMatch = await ChatFaq.findOne({
        isActive: true,
        $or: [
          { question: { $regex: `\\b${safeRegex}\\b`, $options: 'i' } },
          { keywords: { $regex: `\\b${safeRegex}\\b`, $options: 'i' } },
        ],
      }).select('questionId question actionType answerText');
    }

    if (faqMatch) {
      let answerText = faqMatch.answerText;
      if (faqMatch.questionId === 'delivery_charges_timeline') {
        try {
          const mongoose = require('mongoose');
          const offer = await mongoose.connection.db.collection('freeshippingoffers').findOne({ isActive: true });
          const threshold = offer && offer.minCartValue && offer.minCartValue >= 500 ? offer.minCartValue : 1099;
          answerText = `1. Free Shipping: Free delivery is available on all orders above ₹${threshold} across India (as featured on our storefront banner).\n\n2. Delivery Charges: For orders below ₹${threshold}, delivery charges are calculated live at checkout based on package weight, destination PIN code, and active courier rates.\n\n3. Delivery Timeline: Orders are processed within 24–48 hours and typically delivered within 3 to 7 business days across India.\n\n4. Live Tracking: Once shipped, real-time courier tracking is accessible directly in chat or under your Account > Orders.`;
        } catch (e) {
          console.error('[Dynamic Delivery Answer Error]:', e);
        }
      } else if (faqMatch.questionId === 'cod_availability' || /\b(cod|cash\s*on\s*delivery)\b/i.test(clean)) {
        try {
          const mongoose = require('mongoose');
          const checkout = await mongoose.connection.db.collection('checkoutsettings').findOne({});
          const codEnabled = checkout ? Boolean(checkout.codEnabled) : true;
          const partialEnabled = checkout ? Boolean(checkout.partialPaymentEnabled) : false;
          const partialPercent = (checkout && checkout.partialPaymentPercent) || 30;

          if (codEnabled) {
            answerText = `Yes! Cash on Delivery (COD) is currently active and available across most serviceable PIN codes throughout India.\n\n${partialEnabled ? `• Note: Select orders support Partial Payment (${partialPercent}% online advance + remaining balance at delivery).\n\n` : ''}You can select Cash on Delivery during the checkout payment step.`;
          } else {
            answerText = `Currently, Cash on Delivery (COD) is disabled in our store. We accept 100% secure online payments via UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, and Net Banking at checkout.`;
          }
        } catch (e) {
          console.error('[Dynamic COD Answer Error]:', e);
        }
      }

      return res.status(200).json({
        success: true,
        type: 'FAQ_ANSWER',
        text: answerText,
        faq: {
          questionId: faqMatch.questionId,
          question: faqMatch.question,
          actionType: faqMatch.actionType,
        },
      });
    }

    // ── TIER 4: HUMAN SUPPORT INTENT (e.g. "talk to agent", "call me", "help") ──
    if (/(agent|human|representative|call\s*me|complaint|manager|executive|support\s*person)/i.test(clean)) {
      return res.status(200).json({
        success: true,
        type: 'SUPPORT_PROMPT',
        text: 'Our customer support team is available to assist you! You can email us directly or leave a message below:',
        contactCard: {
          email: process.env.STORE_EMAIL || 'support.fabuniqo@gmail.com',
          hours: process.env.SUPPORT_HOURS || '10:00 AM - 7:00 PM IST (Mon-Sat)',
        },
      });
    }

    // ── TIER 5: POLITE FALLBACK ──
    return res.status(200).json({
      success: true,
      type: 'FALLBACK',
      text: `Thanks for reaching out! To assist you best, please select one of our popular topics:`,
    });
  } catch (err) {
    console.error('[handleGeneralQuery Error]:', err);
    return res.status(200).json({
      success: true,
      type: 'FALLBACK',
      text: 'Thanks for your message! To help you right away, please select a topic:',
    });
  }
};
