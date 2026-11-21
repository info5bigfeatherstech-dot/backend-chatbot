const ChatFaq = require('../models/ChatFaq');
const Order = require('../models/Order');
const Product = require('../models/Product');
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

    return res.status(200).json({
      success: true,
      faq: {
        questionId: faq.questionId,
        question: faq.question,
        actionType: faq.actionType,
        answerText: faq.answerText,
        contactCard:
          faq.actionType === 'CONTACT_CARD'
            ? {
                phone: process.env.STORE_PHONE || '8527054683',
                whatsapp: process.env.STORE_WHATSAPP || '8527054683',
                email: process.env.STORE_EMAIL || 'info1.fabuniqo@gmail.com',
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

    const cleanQuery = String(query).replace(/[#\s]/g, '').trim();

    // Try finding by orderId first
    let order = await Order.findOne({
      orderId: { $regex: new RegExp(`^${cleanQuery}$`, 'i') },
    }).select('orderId orderStatus paymentStatus shippingAddress shipmentTracking items createdAt');

    // If not found, try matching by phone number
    if (!order) {
      order = await Order.findOne({
        'shippingAddress.phone': { $regex: cleanQuery, $options: 'i' },
      })
        .sort({ createdAt: -1 })
        .select('orderId orderStatus paymentStatus shippingAddress shipmentTracking items createdAt');
    }

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
      order: {
        orderId: order.orderId,
        status: order.orderStatus || 'Processing',
        paymentStatus: order.paymentStatus || 'Pending',
        itemsCount: (order.items && order.items.length) || 1,
        courier: (order.shipmentTracking && order.shipmentTracking.courierName) || 'Standard Courier',
        trackingNumber: order.shipmentTracking && order.shipmentTracking.trackingNumber,
        trackingUrl: order.shipmentTracking && order.shipmentTracking.trackingUrl,
        estimatedDelivery: order.shipmentTracking && order.shipmentTracking.estimatedDeliveryDate,
        customerCity: order.shippingAddress && order.shippingAddress.city,
      },
    });
  } catch (err) {
    console.error('[trackOrder Error]:', err);
    return res.status(500).json({ success: false, message: 'Error tracking order' });
  }
};

// GET /api/chatbot/best-sellers
exports.getBestSellers = async (req, res) => {
  try {
    // Look for active featured items first, or fallback to active items
    let products = await Product.find({ status: 'active', isFeatured: true })
      .limit(4)
      .select('name title slug images variants brand');

    if (!products || products.length === 0) {
      products = await Product.find({ status: 'active' })
        .limit(4)
        .select('name title slug images variants brand');
    }

    const formatted = products.map((p) => {
      const firstVariant = p.variants && p.variants[0];
      const basePrice = firstVariant?.price?.base || 0;
      const salePrice = firstVariant?.price?.sale || null;
      
      // Images in MongoDB products are stored in variant images or product images
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

    return res.status(200).json({
      success: true,
      products: formatted,
    });
  } catch (err) {
    console.error('[getBestSellers Error]:', err);
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
