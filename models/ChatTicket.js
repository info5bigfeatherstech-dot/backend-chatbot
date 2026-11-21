const mongoose = require('mongoose');

const chatTicketSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      trim: true,
      default: 'Guest User',
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General Support',
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatTicket', chatTicketSchema, 'chat_tickets');
