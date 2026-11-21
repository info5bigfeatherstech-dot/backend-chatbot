# FABUNIQO Chatbot Backend Service

Standalone Node.js / Express microservice powering the FABUNIQO customer support concierge.

## Architecture
- **Port:** `8082`
- **Database:** MongoDB Atlas (connected directly to storefront collections)
- **Collections:**
  - `orders` (live order tracking by ID or customer phone)
  - `products` (live bestseller product queries and Cloudflare R2 images)
  - `chat_faqs` (structured categorized FAQs and answers)
  - `chat_tickets` (customer support ticket logging)

## Endpoints
- `GET /api/chatbot/welcome` — Greeting, store info & root categories
- `GET /api/chatbot/category/:categoryKey` — Category specific FAQ questions
- `POST /api/chatbot/answer` — Answer content and contact cards
- `POST /api/chatbot/track-order` — Safe order status tracking
- `GET /api/chatbot/best-sellers` — Active featured products with variant images
- `POST /api/chatbot/ticket` — Create customer support inquiry

## Getting Started
1. `npm install`
2. Configure `.env` from `.env.example`
3. Seed FAQs: `node scripts/seedFaqs.js`
4. Start service: `node server.js`
