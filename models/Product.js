const mongoose = require('mongoose');

// Read-only schema matching existing products collection
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: '' },
    brand: { type: String, default: 'Generic' },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, default: 'active' },
    channelStatus: {
      ecomm: { type: String, default: 'active' },
      wholesale: { type: String, default: 'draft' },
    },
    images: [
      {
        url: String,
        altText: String,
      },
    ],
    variants: [
      {
        sku: String,
        price: {
          base: Number,
          sale: Number,
        },
        images: [
          {
            url: String,
            altText: String,
            order: Number,
          },
        ],
        isActive: Boolean,
      },
    ],
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model('Product', productSchema, 'products');
