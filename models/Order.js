const mongoose = require('mongoose');

// Read-only schema matching existing orders collection
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    orderStatus: { type: String, default: 'pending' },
    paymentStatus: { type: String, default: 'pending' },
    deliveryCharges: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    shippingAddress: {
      fullName: String,
      phone: String,
      city: String,
      state: String,
      pincode: String,
    },
    shipmentTracking: {
      courierName: String,
      trackingNumber: String,
      trackingUrl: String,
      status: String,
      estimatedDeliveryDate: Date,
    },
    items: [
      {
        quantity: Number,
        priceSnapshot: { total: Number },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema, 'orders');
