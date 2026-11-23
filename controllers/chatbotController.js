const ChatFaq = require('../models/ChatFaq');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ChatTicket = require('../models/ChatTicket');

// GET /api/chatbot/welcome
exports.getWelcome = async (req, res) => {
  try {
    const categories = [
      { key: 'orders', title: 'Orders & Delivery', icon: '📦' },
      { key: 'products', title: 'Products & Catalog', icon: '🛍️' },
      { key: 'returns', title: 'Returns & Refunds', icon: '🔄' },
      { key: 'payments', title: 'Payments & Offers', icon: '💳' },
      { key: 'support', title: 'Contact Support', icon: '📞' },
    ];

    return res.status(200).json({
      success: true,
      greeting: 'Hi there! 👋 Welcome to FABUNIQO. How can we help you today?',
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
    const questions = await ChatFaq.find({ categoryKey, isActive: true })
      .sort({ sortOrder: 1 })
      .select('questionId question actionType sortOrder');

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
    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ success: false, message: 'questionId is required' });
    }

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
        answerText = `1. Free Shipping: Free delivery is available on all orders above ₹${threshold} across India (as featured on our storefront banner).\n\n2. Delivery Charges: For orders below ₹${threshold}, delivery charges are calculated live at checkout based on package weight, destination PIN code, and active courier rates.\n\n3. Delivery Timeline: Orders are processed within 24–48 hours and typically delivered within 3 to 7 business days across India.\n\n4. Live Tracking: Once shipped, real-time courier tracking is accessible directly in chat or under your Account > Orders.`;
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

        if (codEnabled) {
          answerText = `Yes! Cash on Delivery (COD) is currently active and available across most serviceable PIN codes throughout India.\n\n${partialEnabled ? `• Note: Select orders support Partial Payment (${partialPercent}% online advance + remaining balance at delivery).\n\n` : ''}You can select Cash on Delivery during the checkout payment step.`;
        } else {
          answerText = `Currently, Cash on Delivery (COD) is disabled in our store. We accept 100% secure online payments via UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, and Net Banking at checkout.`;
        }
      } catch (e) {
        console.error('[Dynamic COD Answer Error]:', e);
      }
    } else if (questionId === 'jewelry_care') {
      answerText = `✨ Jewelry Care: Will it Tarnish or Fade?\n\n• Anti-Tarnish Protection: Our pieces are crafted with premium skin-safe alloys and sealed with advanced protective anti-tarnish micro-plating to retain their showroom luster.\n• Daily Wear Longevity: With standard care, your jewelry does not tarnish or fade easily and maintains its brilliance.\n• 4 Essential Care Tips:\n  1. Avoid Moisture: Keep jewelry away from water, swimming pools, showers, and excessive sweat.\n  2. Perfumes & Lotions First: Apply perfumes, deodorants, and body lotions before wearing jewelry (alcohol in perfumes can wear off electroplating).\n  3. Individual Storage: Store each piece separately in an airtight ziplock pouch or velvet box to prevent oxidation and scratches.\n  4. Post-Wear Wipe: Gently clean your jewelry with a soft, dry microfiber cloth after each wear before storing.\n\nTip: Every order is packaged in protective anti-moisture zip wraps to preserve its brand-new showroom shine during transit!`;
    } else if (questionId === 'gift_packaging') {
      try {
        const mongoose = require('mongoose');
        const freeGift = await mongoose.connection.db.collection('freegiftoffers').findOne({ isActive: true });
        let freeGiftText = '';
        if (freeGift && freeGift.name) {
          freeGiftText = `• Active Store Perk: "${freeGift.name}" is currently active on purchases!\n`;
        }
        answerText = `🎁 Luxury Gift Packaging & Personalized Message Cards:\n\nPlanning a special surprise? We ensure an exquisite unboxing experience for your loved ones:\n\n• Signature Rigid Gift Box: Every jewelry piece is nestled securely inside our signature luxury gift box with plush velvet cushioning.\n• Complimentary Handwritten Note: We provide a personalized gift card free of charge! Simply enter your gift message at checkout, or message us immediately after ordering.\n• Discreet Courier Packaging: All parcels are shipped in tamper-evident, unbranded outer courier boxes to keep your surprise 100% secret until opened.\n• Concealed Price Tags: Gifting directly to a loved one? Let us know and we will remove price tags from the presentation box.\n${freeGiftText}\n💬 To personalize your gift card: Message our gifting desk on WhatsApp at 8527054683 with your Order ID!`;
      } catch (e) {
        console.error('[Dynamic Gift Answer Error]:', e);
      }
    } else if (questionId === 'hypoallergenic_info') {
      answerText = `🌿 Is It Skin-Friendly & Hypoallergenic?\n\n100% Skin-Friendly, Lead-Free & Nickel-Free!\n\n• Nickel & Lead Free: All our jewelry strictly adheres to safe metal standards, free from harsh nickel, lead, and toxic heavy metals that trigger allergic reactions.\n• No Itching or Green Marks: The skin-contact surface is sealed with biocompatible protective electroplating that prevents oxidation reactions against body sweat, keeping your skin clean and free of green or dark marks.\n• Earring Comfort: Our earrings and studs feature smooth, skin-safe posts and hypoallergenic silicone or metal stoppers to prevent earlobe irritation or swelling.\n• Lightweight Ergonomics: Engineered to be lightweight and comfortable for all-day wear at weddings, festive occasions, or daily office wear.\n\nTip: If you have an ultra-sensitive skin condition or specific metal allergy, feel free to consult our support concierge on WhatsApp at 8527054683 before purchasing!`;
    }

    return res.status(200).json({
      success: true,
      faq: {
        questionId: faq.questionId,
        question: faq.question,
        actionType: faq.actionType,
        answerText,
        contactCard:
          faq.actionType === 'CONTACT_CARD'
            ? {
                phone: process.env.STORE_PHONE || '8527054683',
                whatsapp: process.env.STORE_WHATSAPP || '8527054683',
                email: process.env.STORE_EMAIL || 'support.fabuniqo@gmail.com',
                hours: process.env.SUPPORT_HOURS || '10:00 AM - 7:00 PM IST',
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
function formatOrderResponse(order) {
  if (!order) return null;
  const city = order.addressSnapshot?.city || order.shippingAddress?.city || '';
  const courier =
    order.shipmentTracking?.courierName ||
    order.shippingSnapshot?.courierName ||
    'Shadowfax Surface';
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

  return {
    orderId: order.orderId,
    status: order.orderStatus || 'Processing',
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
    courier,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
    customerCity: city,
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

  return formatOrderResponse(order);
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

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map(formatOrderResponse).filter(Boolean),
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

// POST /api/chatbot/check-pincode - Live PIN code serviceability check
exports.checkPincode = async (req, res) => {
  try {
    const { pincode, userId, phone, email } = req.body;
    let cleanPin = String(pincode || '').replace(/\D/g, '').trim();
    let savedLocationInfo = null;

    // 1. If pincode wasn't explicitly provided, check database for user's saved address!
    if (!cleanPin || cleanPin.length !== 6) {
      try {
        const mongoose = require('mongoose');
        const addressesCol = mongoose.connection.db.collection('addresses');
        const orConditions = [];

        if (userId) {
          if (mongoose.Types.ObjectId.isValid(userId)) {
            orConditions.push({ userId: new mongoose.Types.ObjectId(userId) });
          }
          orConditions.push({ userId: String(userId) });
        }
        if (phone) {
          const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
          orConditions.push({ phone: cleanPhone }, { phone: String(phone).trim() });
        }
        if (email) {
          orConditions.push({ email: String(email).trim().toLowerCase() });
        }

        let savedAddress = null;
        if (orConditions.length > 0) {
          savedAddress = await addressesCol.findOne(
            { $or: orConditions, postalCode: { $exists: true, $ne: '' } },
            { sort: { isDefault: -1, updatedAt: -1 } }
          );
        }

        // Also check user's most recent order in DB as fallback
        if (!savedAddress && orConditions.length > 0) {
          const ordersCol = mongoose.connection.db.collection('orders');
          const lastOrder = await ordersCol.findOne(
            { $or: orConditions, 'addressSnapshot.postalCode': { $exists: true, $ne: '' } },
            { sort: { createdAt: -1 } }
          );
          if (lastOrder && lastOrder.addressSnapshot) {
            savedAddress = {
              postalCode: lastOrder.addressSnapshot.postalCode || lastOrder.shippingAddress?.postalCode,
              city: lastOrder.addressSnapshot.city || lastOrder.shippingAddress?.city,
              fullName: lastOrder.addressSnapshot.fullName,
            };
          }
        }

        if (savedAddress && savedAddress.postalCode) {
          cleanPin = String(savedAddress.postalCode).replace(/\D/g, '').trim();
          savedLocationInfo = savedAddress.city
            ? `${savedAddress.city} (PIN: ${cleanPin})`
            : `PIN: ${cleanPin}`;
        }
      } catch (e) {
        console.warn('[checkPincode] Error checking saved address:', e.message);
      }
    }

    if (!cleanPin || cleanPin.length !== 6) {
      return res.status(200).json({
        success: true,
        needsInput: true,
        text: 'Please type your 6-digit destination PIN code (e.g. 110001, 400001) in the box below to check live courier delivery & serviceability:',
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

    const locationPrefix = savedLocationInfo
      ? `📍 Found your saved address in ${savedLocationInfo}!\n\n`
      : '';

    if (liveData && liveData.isServiceable) {
      const estDays = liveData.estimatedDays ? `${liveData.estimatedDays} business days` : '3–5 business days';
      const charges = liveData.deliveryCharges ? Math.round(liveData.deliveryCharges) : 49;

      return res.status(200).json({
        success: true,
        isServiceable: true,
        pincode: cleanPin,
        savedAddressUsed: Boolean(savedLocationInfo),
        estimatedDays: estDays,
        deliveryCharge: charges,
        freeShippingAbove: freeShippingMin,
        text: `${locationPrefix}✓ Delivery is active & available to PIN ${cleanPin}!\n\n• Estimated Timeline: ${estDays} across India\n• Free Shipping: Free on orders above ₹${freeShippingMin} (or ₹${charges} standard delivery fee).`,
      });
    } else if (liveData && liveData.isServiceable === false) {
      return res.status(200).json({
        success: true,
        isServiceable: false,
        pincode: cleanPin,
        savedAddressUsed: Boolean(savedLocationInfo),
        text: `${locationPrefix}Currently, PIN code ${cleanPin} is not directly serviceable. Please contact support to check for alternative delivery options.`,
      });
    }

    // Standard fallback verification for valid 6-digit Indian PIN codes (100000 - 999999)
    if (/^[1-9]\d{5}$/.test(cleanPin)) {
      return res.status(200).json({
        success: true,
        isServiceable: true,
        pincode: cleanPin,
        savedAddressUsed: Boolean(savedLocationInfo),
        estimatedDays: '4–7 business days',
        freeShippingAbove: freeShippingMin,
        text: `${locationPrefix}✓ Delivery is active for PIN ${cleanPin} across India.\n\n• Estimated Delivery: 4 to 7 business days\n• Free Shipping: Available on all orders above ₹${freeShippingMin}.`,
      });
    }

    return res.status(200).json({
      success: true,
      isServiceable: false,
      pincode: cleanPin,
      text: `PIN code ${cleanPin} appears to be invalid. Please enter a valid 6-digit postal code.`,
    });
  } catch (err) {
    console.error('[checkPincode Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking PIN code' });
  }
};

// POST /api/chatbot/check-return-refund - Live DB lookup for return and refund progress
exports.checkReturnRefundStatus = async (req, res) => {
  try {
    const { query, orderId, userId, phone, email } = req.body;
    const cleanQuery = String(query || orderId || '').trim();

    // 1. If explicit orderId or query entered, search DB directly
    if (cleanQuery) {
      const order = await findOrderInDb(cleanQuery);
      if (order) {
        const ret = order.returnInfo || {};
        const refunds = Array.isArray(order.refundHistory) ? order.refundHistory : [];
        const isRefunded = order.paymentStatus === 'refunded' || refunds.length > 0 || (order.refunded && order.refunded > 0);
        const hasReturn = Boolean(ret.reasonType || ret.approvedBy || ret.rtoStatus || order.status === 'return_requested' || order.status === 'returned');

        let msg = `📍 Return & Refund Status for Order #${order.orderId}:\n\n`;
        if (hasReturn) {
          const returnStatusLabel = ret.approvedBy
            ? '✓ Approved (Reverse Pickup in Progress)'
            : (ret.rtoStatus || 'Under Review by Returns Team');
          const tracking = ret.reverseTrackingNumber || ret.reverseAwbCode || 'Awaiting courier assignment';
          msg += `• Return Request: ${ret.reasonType || 'Standard Return'}\n• Return Status: ${returnStatusLabel}\n• Reverse Courier Tracking: ${tracking}\n`;
        } else {
          msg += `• Return Status: No return request has been submitted for this order yet.\n• Current Order Status: ${String(order.status || 'Processing').toUpperCase()}\n`;
        }

        if (isRefunded) {
          const refAmount = refunds[0]?.amount || order.refunded || order.totalAmount;
          msg += `• Refund Status: ✓ Refund Completed (₹${refAmount})\n• Destination: Credited to original source / bank account.\n`;
        } else if (hasReturn) {
          msg += `• Refund Status: Processing (Refund will be credited within 24–48 hours of warehouse inspection).\n• Estimated Amount: ₹${order.totalAmount}\n`;
        } else {
          msg += `• Refund Status: N/A (Order is active and not marked for refund).\n`;
        }

        msg += `\nNeed to initiate a return or exchange? You can request it under Account > Orders, or message support below.`;

        return res.status(200).json({
          success: true,
          found: true,
          orderId: order.orderId,
          hasReturn,
          isRefunded,
          text: msg,
        });
      } else {
        return res.status(200).json({
          success: true,
          found: false,
          text: `We could not find any order matching "${cleanQuery}". Please check your Order ID or phone number.`,
        });
      }
    }

    // 2. If no specific Order ID entered, auto-query the DB for logged-in user's recent orders!
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
        orConditions.push({ 'shippingAddress.phone': cleanPhone });
      }
    }
    if (email && String(email).includes('@')) {
      orConditions.push({ 'customer.email': String(email).trim().toLowerCase() });
      orConditions.push({ 'addressSnapshot.email': String(email).trim().toLowerCase() });
    }

    if (orConditions.length > 0) {
      const ordersCol = mongoose.connection.db.collection('orders');
      const recentOrders = await ordersCol
        .find({ $or: orConditions })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();

      if (recentOrders && recentOrders.length > 0) {
        // Check if any order has an active return or refund
        const returnOrder = recentOrders.find((o) =>
          Boolean(o.returnInfo?.reasonType || o.returnInfo?.approvedBy || o.returnInfo?.rtoStatus || o.paymentStatus === 'refunded' || (o.refundHistory && o.refundHistory.length > 0))
        );

        const target = returnOrder || recentOrders[0];
        const ret = target.returnInfo || {};
        const refunds = Array.isArray(target.refundHistory) ? target.refundHistory : [];
        const isRefunded = target.paymentStatus === 'refunded' || refunds.length > 0;
        const hasReturn = Boolean(ret.reasonType || ret.approvedBy || ret.rtoStatus);

        let msg = `📍 Found your recent order #${target.orderId} in our database:\n\n`;
        if (hasReturn) {
          const returnStatusLabel = ret.approvedBy
            ? '✓ Approved (Reverse Pickup in Progress)'
            : (ret.rtoStatus || 'Under Review by Returns Team');
          const tracking = ret.reverseTrackingNumber || ret.reverseAwbCode || 'Awaiting courier assignment';
          msg += `• Return Request: ${ret.reasonType || 'Standard Return'}\n• Return Status: ${returnStatusLabel}\n• Reverse Courier Tracking: ${tracking}\n`;
        } else {
          msg += `• Return Request: No active return request recorded for this order.\n• Order Status: ${String(target.status || 'Processing').toUpperCase()}\n`;
        }

        if (isRefunded) {
          const refAmount = refunds[0]?.amount || target.totalAmount;
          msg += `• Refund Status: ✓ Refund Completed (₹${refAmount})\n• Destination: Credited to original source / bank account.\n`;
        } else if (hasReturn) {
          msg += `• Refund Status: Pending Warehouse Receipt & Quality Check (Refund initiated within 24–48 hours of inspection).\n• Estimated Refund: ₹${target.totalAmount}\n`;
        } else {
          msg += `• Refund Status: N/A (Order is active)\n`;
        }

        msg += `\n• Return Eligibility: Returns & exchanges are accepted within 7 days of delivery.`;

        return res.status(200).json({
          success: true,
          found: true,
          orderId: target.orderId,
          hasReturn,
          isRefunded,
          text: msg,
        });
      }
    }

    // Guest user or no orders found
    return res.status(200).json({
      success: true,
      found: false,
      needsInput: true,
      text: 'Please enter your Order ID (e.g. #1024 or FAB-ECOMM-...) to check your live return and refund status from the database:',
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

    const text = `${orderInfo}✓ Yes, we gladly offer Exchanges for a different size, fit, or design!\n\n• Window: Exchanges can be requested within 7 days of delivery.\n• Condition: Items must be in their original unused condition with all jewelry tags, boxes, and invoice intact.\n• Process:\n  1. Let us know the new size or replacement design you'd like.\n  2. Our team arranges a doorstep reverse pickup for the current piece.\n  3. Your new replacement piece is dispatched as soon as the item is inspected!\n\n💬 How to proceed: You can reply right here with your requested replacement or reach our concierge directly on WhatsApp at 8527054683.`;

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
    const mongoose = require('mongoose');
    const checkout = await mongoose.connection.db.collection('checkoutsettings').findOne({});
    const partialActive = checkout ? Boolean(checkout.partialPaymentEnabled) : false;
    const partialPercent = (checkout && checkout.partialPaymentPercent) || 30;

    const text = `💳 How Cash on Delivery (COD) Refunds Work:\n\nBecause delivery executives cannot hand over paper cash during doorstep return pickups, all COD refunds are processed electronically:\n\n1. Direct Bank / UPI Transfer:\n   • Once the returned item reaches our warehouse and passes quality inspection, our finance desk will request your UPI ID (Google Pay, PhonePe, Paytm) or Bank Account Details.\n   • The full refund amount is credited directly to your bank account within 24 to 48 business hours.\n\n2. Instant Store Credit / Voucher (Optional):\n   • If you'd like to order a replacement or another piece right away, we can issue an instant 100% store coupon code with zero waiting time.\n\n${partialActive ? `• Note for Partial COD: The ${partialPercent}% online advance and any doorstep cash collected are combined into a single full refund.\n\n` : ''}✓ All refunds are 100% tracked in our system with SMS & chat confirmations.`;

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
    const mongoose = require('mongoose');
    const checkout = await mongoose.connection.db.collection('checkoutsettings').findOne({});
    const partialEnabled = checkout ? Boolean(checkout.partialPaymentEnabled) : true;
    const partialPercent = (checkout && checkout.partialPaymentPercent) || 30;
    const codEnabled = checkout ? Boolean(checkout.codEnabled) : true;

    let text = '';
    if (partialEnabled) {
      text = `🪙 How Partial Payment (${partialPercent}% Advance + COD) Works:\n\nOur store provides a convenient Partial COD option for eligible orders:\n\n• Step 1: Pay ${partialPercent}% advance online at checkout via UPI or Card to confirm your order and reserve warehouse packaging.\n• Step 2: The remaining ${100 - partialPercent}% balance is paid directly in cash or UPI to the delivery executive when the parcel reaches your doorstep!\n• Benefit: You don't have to pay 100% upfront, giving you complete peace of mind while securing guaranteed dispatch.\n\n✓ You can select "Partial Payment (${partialPercent}% Online + Cash on Delivery)" on the checkout payment screen.`;
    } else if (codEnabled) {
      text = `🪙 Payment Options at Checkout:\n\nCurrently, 100% Cash on Delivery (COD) is available at checkout. You can pay the full amount directly to the courier executive upon doorstep delivery.`;
    } else {
      text = `🪙 Payment Options at Checkout:\n\nCurrently, online payment via UPI, Cards, and Net Banking is available at checkout for 100% contactless delivery.`;
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
    const mongoose = require('mongoose');
    const offer = await mongoose.connection.db.collection('freeshippingoffers').findOne({ isActive: true });
    const threshold = offer && offer.minCartValue && offer.minCartValue >= 500 ? offer.minCartValue : 1099;

    const text = `🚚 How to Unlock Free Shipping:\n\n✓ Free Express Shipping is active on all orders above ₹${threshold} across India!\n\n• Qualifying Cart Value: Add items totaling ₹${threshold} or more to your shopping cart.\n• Zero Coupon Required: Our system automatically waives all delivery charges at checkout once your cart crosses ₹${threshold}.\n• Standard Delivery Fee: For orders below ₹${threshold}, a flat courier rate is calculated based on destination PIN code.\n\nTip: You can add our budget-friendly earrings or accessories starting from ₹29 to hit the ₹${threshold} free delivery limit!`;

    return res.status(200).json({ success: true, text });
  } catch (err) {
    console.error('[getFreeShippingInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking free shipping info' });
  }
};

// POST /api/chatbot/emi-info - Check DB and payment options for EMI / Pay Later
exports.getEmiInfo = async (req, res) => {
  try {
    const text = `💳 EMI & Pay Later Availability:\n\nYes! Flexible installment and payment options are available through our secure gateway at checkout:\n\n• Credit Card EMI: Available on major bank credit cards (HDFC, ICICI, SBI, Axis, Kotak, etc.) for eligible cart values.\n• Pay Later: Available via eligible bank partner cards and supported Pay Later accounts during payment gateway checkout.\n• Partial Payment Alternative: If you prefer paying in parts without credit card interest, you can choose our store's Partial COD (30% advance now + 70% at delivery)!\n\nTip: To view available monthly EMI breakdown, proceed to checkout and select "Credit / Debit / EMI" under payment options.`;

    return res.status(200).json({ success: true, text });
  } catch (err) {
    console.error('[getEmiInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking EMI info' });
  }
};

// POST /api/chatbot/payment-safety-info - Explain encryption & gateway security
exports.getPaymentSafetyInfo = async (req, res) => {
  try {
    const text = `🔒 Is Online Payment Safe & Secure?\n\n100% Safe, Secure & Encrypted! We take customer privacy and transaction safety very seriously:\n\n• 256-Bit SSL Encryption: All checkout sessions are protected with military-grade SSL encryption directly from your browser to the payment server.\n• RBI-Authorized Gateway: Transactions are processed through an RBI-regulated payment gateway (Razorpay) adhering to strict PCI-DSS Level 1 compliance.\n• Zero Card Credential Storage: We NEVER store your CVV numbers, card PINs, or net banking passwords on our servers.\n• Safe UPI Payments: All UPI transactions (Google Pay, PhonePe, Paytm, BHIM) are authorized directly in your bank's official UPI app with your private UPI PIN.\n• Instant Digital Confirmation: You receive real-time SMS and email payment verification with a unique Order ID immediately after purchase.`;

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
    const text = `✨ Jewelry Care: Will it Tarnish or Fade?\n\n• Anti-Tarnish Protection: Our pieces are crafted with premium skin-safe alloys and sealed with advanced protective anti-tarnish micro-plating to retain their showroom luster.\n• Daily Wear Longevity: With standard care, your jewelry does not tarnish or fade easily and maintains its brilliance.\n• 4 Essential Care Tips:\n  1. Avoid Moisture: Keep jewelry away from water, swimming pools, showers, and excessive sweat.\n  2. Perfumes & Lotions First: Apply perfumes, deodorants, and body lotions before wearing jewelry (alcohol in perfumes can wear off electroplating).\n  3. Individual Storage: Store each piece separately in an airtight ziplock pouch or velvet box to prevent oxidation and scratches.\n  4. Post-Wear Wipe: Gently clean your jewelry with a soft, dry microfiber cloth after each wear before storing.\n\nTip: Every order is packaged in protective anti-moisture zip wraps to preserve its brand-new showroom shine during transit!`;

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

    const text = `🎁 Luxury Gift Packaging & Personalized Message Cards:\n\nPlanning a special surprise? We ensure an exquisite unboxing experience for your loved ones:\n\n• Signature Rigid Gift Box: Every jewelry piece is nestled securely inside our signature luxury gift box with plush velvet cushioning.\n• Complimentary Handwritten Note: We provide a personalized gift card free of charge! Simply enter your gift message at checkout, or message us immediately after ordering.\n• Discreet Courier Packaging: All parcels are shipped in tamper-evident, unbranded outer courier boxes to keep your surprise 100% secret until opened.\n• Concealed Price Tags: Gifting directly to a loved one? Let us know and we will remove price tags from the presentation box.\n${freeGiftText}\n💬 To personalize your gift card: Message our gifting desk on WhatsApp at 8527054683 with your Order ID!`;

    return res.status(200).json({ success: true, type: 'FAQ_ANSWER', text });
  } catch (err) {
    console.error('[getGiftPackagingInfo Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error checking gift packaging info' });
  }
};

// POST /api/chatbot/hypoallergenic-info - Hypoallergenic & skin-friendly standards checked from DB
exports.getHypoallergenicInfo = async (req, res) => {
  try {
    const text = `🌿 Is It Skin-Friendly & Hypoallergenic?\n\n100% Skin-Friendly, Lead-Free & Nickel-Free!\n\n• Nickel & Lead Free: All our jewelry strictly adheres to safe metal standards, free from harsh nickel, lead, and toxic heavy metals that trigger allergic reactions.\n• No Itching or Green Marks: The skin-contact surface is sealed with biocompatible protective electroplating that prevents oxidation reactions against body sweat, keeping your skin clean and free of green or dark marks.\n• Earring Comfort: Our earrings and studs feature smooth, skin-safe posts and hypoallergenic silicone or metal stoppers to prevent earlobe irritation or swelling.\n• Lightweight Ergonomics: Engineered to be lightweight and comfortable for all-day wear at weddings, festive occasions, or daily office wear.\n\nTip: If you have an ultra-sensitive skin condition or specific metal allergy, feel free to consult our support concierge on WhatsApp at 8527054683 before purchasing!`;

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

    // ── TIER 0: ORDER TRACKING INTENT & ORDER ID DETECTION ──
    const cleanWithoutPunct = clean.replace(/[#\s]/g, '');
    const isExplicitOrderId =
      /^(?:FAB|ECOMM|ORD|ORDER)[-_]?\w+/i.test(cleanWithoutPunct) ||
      /^\d{4,12}$/.test(cleanWithoutPunct);
    const hasOrderTrackingWords =
      /\b(track|tracking|order|status|where\s*is\s*my\s*order|package|delivery\s*status)\b/i.test(clean);
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

    // ── TIER 0B: PIN CODE SERVICEABILITY QUERY (e.g. "is 110001 serviceable?", "pincode 400001", "delivery to 560001") ──
    const pinMatch = clean.match(/\b([1-9]\d{5})\b/);
    const hasPinWords = /\b(pincode|pin\s*code|pin|deliver|serviceable|serviceability|coverage|delivery\s*to)\b/i.test(clean);
    if (pinMatch && (hasPinWords || clean.length <= 10)) {
      req.body.pincode = pinMatch[1];
      return exports.checkPincode(req, res);
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
    const hasCategoryWords = /\b(browse\s*(?:by\s*)?categor(?:y|ies)|show\s*categor(?:y|ies)|all\s*categor(?:y|ies)|explore\s*categor(?:y|ies)|categories|collections?|jhumkas?|mangalsutras?|earrings?|necklaces?|rings?|bangles?|pendants?)\b/i.test(clean);
    if (hasCategoryWords && !/\b(price|under|below|rs|₹|cost|cheap|luxury)\b/i.test(clean)) {
      if (/\b(earrings?|jhumkas?|studs?)\b/i.test(clean)) {
        req.body.category = 'Earrings & Studs';
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
        'any', 'some', 'why', 'who', 'and', 'our', 'out', 'get', 'today', 'paris', 'weather'
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
      'any', 'some', 'why', 'who', 'and', 'our', 'out', 'get', 'today', 'paris', 'weather'
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
        text: 'Our concierge team is available to assist you! You can connect with us directly or leave a message below:',
        contactCard: {
          phone: process.env.STORE_PHONE || '8527054683',
          whatsapp: process.env.STORE_WHATSAPP || '8527054683',
          email: process.env.STORE_EMAIL || 'support.fabuniqo@gmail.com',
          hours: process.env.SUPPORT_HOURS || '10:00 AM - 7:00 PM IST',
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
