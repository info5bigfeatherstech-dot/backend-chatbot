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

// Helper: Format raw products into lightweight card items with images
function formatProducts(products) {
  if (!Array.isArray(products)) return [];
  return products.map((p) => {
    const firstVariant = p.variants && p.variants[0];
    const basePrice = firstVariant?.price?.base || 0;
    const salePrice = firstVariant?.price?.sale || null;

    let thumbnail = '';
    if (firstVariant?.images && firstVariant.images.length > 0) {
      thumbnail = firstVariant.images[0].url || '';
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
      price: salePrice && salePrice < basePrice ? salePrice : basePrice,
      originalPrice: salePrice && salePrice < basePrice ? basePrice : null,
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

    // ── TIER 1: PRICE / BUDGET QUERY (e.g. "under 99", "below 500", "under 1000rs") ──
    const priceMatch =
      clean.match(/(?:under|below|less\s*than|within)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i) ||
      clean.match(/(?:rs\.?|inr|₹)?\s*(\d+)\s*(?:under|below|budget|max)/i) ||
      clean.match(/(?:under|below)\s*(\d+)/i);

    if (priceMatch && priceMatch[1]) {
      const maxPrice = parseInt(priceMatch[1], 10);
      if (!isNaN(maxPrice) && maxPrice > 0) {
        // Query products with active status and price <= maxPrice
        const products = await Product.find({
          ...ecommActiveFilter,
          $or: [
            { 'variants.price.sale': { $lte: maxPrice, $gt: 0 } },
            { 'variants.price.base': { $lte: maxPrice, $gt: 0 } },
          ],
        })
          .limit(4)
          .select('name title slug images variants brand');

        if (products && products.length > 0) {
          return res.status(200).json({
            success: true,
            type: 'PRODUCTS',
            text: `Here are our pieces under ₹${maxPrice}:`,
            products: formatProducts(products),
          });
        } else {
          // If none under that price, find lowest priced active items as helpful recommendations
          const affordable = await Product.find(ecommActiveFilter)
            .sort({ 'variants.price.sale': 1, 'variants.price.base': 1 })
            .limit(3)
            .select('name title slug images variants brand');

          const formattedAffordable = formatProducts(affordable);
          const lowest = formattedAffordable[0]?.price;

          return res.status(200).json({
            success: true,
            type: 'PRODUCTS',
            text: lowest
              ? `We currently don't have items under ₹${maxPrice}, but check out our most affordable pieces starting at ₹${lowest}:`
              : `We couldn't find items under ₹${maxPrice}. Here are our recommended items:`,
            products: formattedAffordable,
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
