const mongoose = require('mongoose');

// Read-only schema matching existing orders collection in MongoDB Atlas
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    orderStatus: { type: String, default: 'pending' },
    paymentStatus: { type: String, default: 'pending' },
    deliveryCharges: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    addressSnapshot: {
      fullName: String,
      phone: String,
      city: String,
      state: String,
      postalCode: String,
    },
    shippingAddress: {
      fullName: String,
      phone: String,
      city: String,
      state: String,
      pincode: String,
    },
    shippingSnapshot: {
      courierName: String,
      estimatedDays: String,
    },
    shipmentInfo: {
      fulfillmentArtifactAwb: String,
      assignedCourierId: String,
      pickupDate: Date,
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
  { timestamps: true, strict: false }
);

module.exports = mongoose.model('Order', orderSchema, 'orders');

