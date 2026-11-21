const mongoose = require('mongoose');

const chatFaqSchema = new mongoose.Schema(
  {
    categoryKey: {
      type: String,
      required: true,
      enum: ['orders', 'products', 'returns', 'payments', 'support'],
      index: true,
    },
    categoryTitle: {
      type: String,
      required: true,
    },
    categoryIcon: {
      type: String,
      default: '📦',
    },
    questionId: {
      type: String,
      required: true,
      unique: true,
    },
    question: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: ['STATIC_TEXT', 'ORDER_TRACK', 'BEST_SELLERS', 'CONTACT_CARD', 'RAISE_TICKET'],
      default: 'STATIC_TEXT',
    },
    answerText: {
      type: String,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatFaq', chatFaqSchema, 'chat_faqs');
