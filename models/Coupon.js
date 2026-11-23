const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    maxDiscountAmount: { type: Number, default: null },
    minOrderValue: { type: Number, default: 0 },
    applicableUsers: [{ type: String }],
    allowedLoyaltyBadges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyBadge' }],
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    expiryDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
