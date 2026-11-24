// D:\chatbot-backend\constants\hinglishFaqs.js

const HINGLISH_CATEGORIES = [
  { key: 'orders', title: 'Orders & Tracking', icon: '📦' },
  { key: 'products', title: 'Products & Catalog', icon: '🛍️' },
  { key: 'returns', title: 'Returns & Refunds', icon: '🔄' },
  { key: 'payments', title: 'Payments & Offers', icon: '💳' },
  { key: 'support', title: 'Customer Support', icon: '📞' },
];

const HINGLISH_QUESTIONS = {
  track_order: '🔍 Apna order track karein',
  delivery_charges_timeline: '🚚 Delivery charges aur delivery timeline',
  cancel_order: '❌ Order cancel ya change kaise karein',
  delivered_not_received: '⚠️ Order delivered dikha raha hai par mila nahi',
  check_pincode: '📮 Apne PIN Code par delivery check karein',
  payment_methods: '💳 Payment ke tareeqe (Accepted Payment Methods)',
  payment_failed_deducted: '⚠️ Paise kat gaye par order confirm nahi hua',
  cod_availability: '💵 Cash on Delivery (COD) uplabdh hai?',
  apply_coupons: '🏷️ Active Discount Coupons dekhein',
  free_shipping_offer: '🚚 Free Shipping kaise milegi?',
  payment_safety: '🔒 Kya online payment safe aur secure hai?',
  best_sellers: '🔥 Best Sellers / Top Products dekhein',
  cheaper_products: '🪙 Budget-Friendly / Kam daam wale products',
  expensive_products: '💎 Premium / Luxury collection',
  out_of_stock: '⏳ Out-of-stock items kab wapas aayenge?',
  size_guide: '📏 Size aur measurement guide',
  browse_by_category: '💍 Category wise dekhein (Earrings, Necklaces)',
  gift_packaging: '🎁 Gift Packaging aur Personal Message Cards',
  return_policy: '📋 Store ki Return Policy kya hai?',
  request_return: '🔄 Return kaise initiate karein?',
  refund_timeline: '💰 Refund kab aur kaise milega?',
  damaged_product: '💔 Kharab ya damaged item mila hai',
  check_return_refund: '🔍 Return / Refund status check karein',
  cod_refund_info: '💳 COD orders ka refund kaise milta hai?',
  contact_details: '✉ Official Customer Support (Email)',
  working_hours_email: '⏰ Kaam ke ghante aur support email',
  leave_ticket: '📝 Message bhejein / Support ticket banayein',
};

const HINGLISH_ANSWERS = {
  payment_methods: `💳 Humare paas 100% Safe aur Secure Payment Options uplabdh hain:

• UPI (Instant & Fast): Google Pay, PhonePe, Paytm, BHIM, Cred.
• Cards: Sabhi Indian & International Visa, MasterCard, RuPay Credit & Debit Cards.
• Net Banking: SBI, HDFC, ICICI, Axis samet 50+ se zyada banks.
• Cash on Delivery (COD): Jyadatar serviceable PIN codes par cash payment ki suvidha uplabdh hai.

Note: Sabhi online payments 256-bit bank grade encryption se 100% safe aur encrypted hain.`,

  payment_failed_deducted: `⚠️ Agar paise kat gaye hain aur order confirm nahi dikh raha hai:

• Ghabrayein nahi, aapke paise 100% safe hain!
• Auto-Reversal: Banking network issue ki wajah se agar payment confirm nahi ho pata, toh bank aamtaur par 24–48 ghante (max 3–5 working days) mein amount auto-reverse kar deta hai.
• Instant Check: Agar aapko hamari taraf se Order Confirmation SMS ya Email mila hai, toh order confirm ho chuka hai.
• Support Help: Agar 24 ghante mein update na mile, toh transaction reference number / screenshot ke saath support.fabuniqo@gmail.com par message karein.`,

  out_of_stock: `⏳ Out-of-Stock Items Restock Information:

• Popular Trending Items: Aamtaur par 7–14 dino ke andar restock ho jate hain.
• Exclusive / Limited Edition: Kuch designs limited piece collection hote hain aur dubara nahi aate.
• Notify Karein: Agar aapko koi specific product pasand hai jo abhi out of stock hai, toh product page par 'Notify Me' dabayein ya support team ko email karein taaki hum aapke liye priority restock check kar sakein.`,

  size_guide: `📏 Jewelry Size aur Fitting Guide:

• Rings: Humari jyadatar stylish rings adjustable hoti hain jo kisi bhi finger size mein comfortable fit ho jati hain.
• Necklaces & Chokers: Sabhi necklaces ke saath extendable loops/chain milti hai taaki aap apni pasand ke anusaar length adjust kar sakein.
• Bangles / Bracelets: Openable clasps ya adjustable sliding closures ke saath aate hain jo standard 2.4 se 2.8 wrist sizes par aasaani se fit ho jate hain.
• Earrings: Lightweight design ke saath aate hain jisse kaan par bilkul bojh nahi padta.`,

  return_policy: `📋 Return aur Refund Policy:

• Return Window: Sirf damaged, defective ya wrong item deliver hone par delivery ke 24 ghante ke andar return request accept ki jati hai.
• Mandatory Unboxing Video: Sealed parcel ko kholte hue shuru se aakhir tak bina cut ya pause ka continuous unboxing video zaroori hai.
• Item Condition: Item unused hona chahiye aur original tags/box ke saath hona chahiye.
• Exchanges: Store policy ke mutabiq size ya design ka direct exchange support nahi hai. Damaged item par return/refund provide kiya jata hai.`,

  request_return: `🔄 Return Request Kaise Raise Karein:

1. Profile Orders Kholein: Website par Account > Orders section mein jayein.
2. Order Select Karein: Jis order ka return karna hai us par click karein.
3. Raise Return Request: 'Raise Return Request' button dabayein.
4. Proof Upload Karein: Unboxing video aur photos upload karein aur issue select karein.
5. Support Review: Humari team 24–48 ghante ke andar verification karke reverse pickup arrange karegi.

👉 Direct link: [📦 Apne Saare Orders Dekhein](/account/orders)`,

  refund_timeline: `💰 Refund Timeline aur Process:

• Online Payments (UPI, Cards, NetBanking): Return parcel warehouse pahunch kar verify hone ke 24–48 ghante mein refund initiate ho jata hai. Bank account mein aane mein aamtaur par 5–7 business days lagte hain.
• Cash on Delivery (COD) Orders: Warehouse verification ke baad support team aapse Bank details / UPI ID lekar direct transfer karti hai.
• Partial Payment Orders: Advance paid online amount policy ke mutabiq verify hone par reverse kiya jata hai.`,

  damaged_product: `💔 Agar aapko damaged ya broken item mila hai:

• Hum dil se maafi maangte hain! Hum aapka issue turant solve karenge.
• Kripya delivery ke 24 ghante ke andar continuous unboxing video aur photos ke saath Account > Orders me jakar return request submit karein.
• Aap support.fabuniqo@gmail.com par bhi apna Order ID aur video bhej sakte hain.
• Verification hote hi hum 100% refund ya replacement process karenge.`,

  contact_details: `✉ Customer Support Desk:

• Official Email: support.fabuniqo@gmail.com
• Phone / WhatsApp: +91 8527054683
• Operating Hours: 10:00 AM - 7:00 PM IST (Somwar se Shanivar)

Hum har query ka reply 24 ghante ke andar dete hain!`,

  working_hours_email: `⏰ Support Timing aur Email:

• Customer Support Email: support.fabuniqo@gmail.com
• Business Hours: Somwar se Shanivar, Subah 10:00 AM se Shaam 7:00 PM IST tak.
• Sunday / Holidays: Sunday ko support desk band rehta hai. Sunday ko aayi mails ka reply Somwar subah priority par diya jata hai.`,

  leave_ticket: `Apna message ya query neeche likhein, humari team aapse jald se jald contact karegi:`,

  payment_safety: `🔒 Online Payment 100% Safe, Secure aur Encrypted Hai!

• 256-Bit SSL Encryption: Checkout session puri tarah military-grade 256-bit SSL encryption se protected hai.
• Secure Payment Processing: Saare transactions RBI-regulated aur strictly PCI-DSS compliant secure payment systems se process hote hain.
• Zero Card Storage: Hum aapka CVV number, card PIN ya banking password kabhi bhi apne server par store nahi karte.
• Safe UPI Payments: Google Pay, PhonePe, Paytm, BHIM payments directly aapke bank ke official app mein aapke private UPI PIN se authorize hote hain.
• Instant Digital Confirmation: Order complete hote hi turant SMS aur Email verification unique Order ID ke saath milta hai.`,

  cod_refund_info: `💳 COD Orders Ka Refund Kaise Milta Hai:

• Direct Bank / UPI Transfer: Cash on Delivery orders ka refund directly aapke verified Bank Account ya UPI ID mein bheja jata hai.
• Verification: Jab return product humare warehouse pahunch kar verify ho jata hai, tab support team aapse phone ya email ke zariye details leti hai.
• Instant Processing: Details aane ke 24 ghante ke andar amount transfer kar diya jata hai.`,

  jewelry_care: `Will it Tarnish or Fade?

• Anti-Tarnish Protection: Humare pieces premium skin-safe alloys se bane hain aur inpar anti-tarnish protective micro-coating lagayi gayi hai.
• Daily Wear Longevity: Normal care ke saath jewelry ka color fade ya tarnish nahi hota.
• 4 Zaruri Care Tips:
  1. Paani se Bachayein: Swimming, shower ya zyada paseene se door rakhein.
  2. Perfumes & Lotions: Pehle perfume ya lotion lagayein, phir jewelry pehnein.
  3. Alag Store Karein: Har piece ko airtight ziplock pouch ya box mein alag rakhein.
  4. Dry Wipe: Pehanne ke baad soft dry kapde se halka sa saaf karke rakhein.`,

  gift_packaging: `🎁 Luxury Gift Packaging aur Personalized Message Cards:

Kisi khas ke liye surprise plan kar rahe hain? Hum aapke apno ke liye ek behtareen unboxing experience taiyaar karte hain:

• Luxury Gift Box: Har jewelry piece signature rigid luxury gift box mein velvet cushioning ke saath pack hota hai.
• Free Personalized Card: Hum free handwritten gift card dete hain! Checkout ke time bas apna gift message enter karein.
• Discreet Courier Packing: Outer box par koi brand name ya rate nahi hota taaki surprise khulne tak secret rahe.
• Invoice Concealment: Agar directly kisi ko gift bhej rahe hain, toh hum presentation box se price tags hata dete hain.

💬 Special gift request ke liye support.fabuniqo@gmail.com par apna Order ID bhej kar batayein!`,

  cancel_order: `❌ Order Cancel ya Change Karne Ka Tareeqa:

1. Dispatch Se Pehle (Cancellations & Changes):
• Cancel Kaise Karein: Dispatch se pehle cancellation ke liye:
  - 24 Ghante Ke Andar: Account > Orders me jakar 'Request Return / Refund' window use karein, YA
  - Support se Sampark: support.fabuniqo@gmail.com par apna Order ID bhej kar turant cancel karwayein.
• Address ya Item Badle: Dispatch hone se pehle customer support ko turant batayein.
• Prepaid Refunds: Online paid orders ka 100% refund 5–7 business days mein original payment source (UPI/Bank) me wapas aa jata hai.

2. Dispatch Ke Baad (In-Transit):
• Dispatch hone ke baad raste mein order cancel nahi kiya ja sakta.
• Doorstep Par Mana Karna (RTO): Agar aap delivery ke time parcel lene se mana karte hain toh courier return ho jata hai. Aise case mein shipping charges refund se deduct ho sakte hain.

3. Delivery Ke Baad:
• Agar aapko damaged ya galat item milta hai, toh delivery ke 24 ghante ke andar bina cut kiye unboxing video ke saath Account > Orders se return request raise kar sakte hain.`,
};

module.exports = {
  HINGLISH_CATEGORIES,
  HINGLISH_QUESTIONS,
  HINGLISH_ANSWERS,
};
