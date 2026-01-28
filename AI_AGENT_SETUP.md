# AI Agent Automation Setup

## Overview
This feature automatically triggers WhatsApp and email notifications when a new order is created (if customer consents).

## Files Modified

### Backend
- `backend/models/Order.js` - Added `contactConsent` field
- `backend/routes/orders.js` - Added automation trigger after order creation
- `backend/services/aiAgentService.js` - NEW: Service for webhook calls and message generation

### Frontend
- `frontend/src/pages/Cart.jsx` - Added consent checkbox

## Environment Variables

Add to `backend/.env`:
```
WEBHOOK_URL=https://omar03.app.n8n.cloud/webhook-test/order
OPENAI_API_KEY=sk-... (optional, for future AI integration)
```

## How to Get WEBHOOK_URL

### Option 1: Using n8n (Recommended)

**n8n** is a free, open-source workflow automation tool. Here's how to set it up:

#### Step 1: Install n8n

**Option A: Cloud (Easiest)**
1. Go to [n8n.cloud](https://n8n.cloud) and sign up (free tier available)
2. Create a new workflow

**Option B: Self-Hosted**
```bash
# Install n8n globally
npm install -g n8n

# Run n8n
n8n start
```
Then access it at `http://localhost:5678`

#### Step 2: Create a Webhook Workflow

1. **Create New Workflow** in n8n dashboard
2. **Add "Webhook" node**:
   - Click "+" to add node
   - Search for "Webhook"
   - Select "Webhook" node
   - Set HTTP Method to `POST`
   - Set Path to `/order` (or any path you want)
   - Click "Listen for Test Event"
   - **Copy the Webhook URL** (looks like: `https://your-n8n-instance.com/webhook/order`)

3. **Add Processing Nodes** (optional):
   - Add "WhatsApp" node to send WhatsApp messages
   - Add "Email" node to send emails
   - Add "OpenAI" node if you want AI-generated messages

4. **Activate the Workflow**:
   - Click "Active" toggle in top-right
   - Your webhook is now live!

#### Step 3: Test Your Webhook

Use the copied URL in your `backend/.env`:
```
WEBHOOK_URL=https://your-n8n-instance.com/webhook/order
```

---

### Option 2: Using Zapier

1. Go to [zapier.com](https://zapier.com) and sign up
2. Create a new Zap
3. Choose "Webhooks by Zapier" as trigger
4. Select "Catch Hook"
5. Copy the Webhook URL provided
6. Use it in your `.env` file

---

### Option 3: Using Make.com (formerly Integromat)

1. Go to [make.com](https://www.make.com) and sign up
2. Create a new scenario
3. Add "Webhooks" → "Custom webhook" module
4. Set it to "Receive a web request"
5. Copy the webhook URL
6. Use it in your `.env` file

---

### Option 4: Using a Test Webhook Service (For Testing Only)

For quick testing, you can use free webhook testing services:

1. **Webhook.site**:
   - Go to [webhook.site](https://webhook.site)
   - Copy the unique URL provided
   - Use it temporarily in your `.env` to see incoming data

2. **RequestBin**:
   - Go to [requestbin.com](https://requestbin.com)
   - Create a new bin
   - Copy the bin URL
   - Use it for testing

**Note**: These are for testing only. For production, use n8n, Zapier, or Make.com.

---

### Option 5: Create Your Own Webhook Endpoint

If you want to create your own webhook receiver:

1. Create a simple Express server:
```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook/order', (req, res) => {
  console.log('Order received:', req.body);
  // Process order data here
  // Send WhatsApp, Email, etc.
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('Webhook server running on port 3001');
});
```

2. Deploy it to Railway, Render, or Heroku
3. Use the deployed URL in your `.env`

---

## Quick Start with n8n (Step-by-Step)

1. **Sign up at n8n.cloud** (or install locally)
2. **Create workflow** → Click "New Workflow"
3. **Add Webhook node**:
   - Drag "Webhook" from nodes panel
   - Set Method: `POST`
   - Set Path: `/order`
   - Click "Listen for Test Event"
   - **Copy the Production URL** (starts with `https://`)
4. **Add your processing nodes** (WhatsApp, Email, etc.)
5. **Activate workflow** (toggle in top-right)
6. **Copy the webhook URL** to `backend/.env`:
   ```
   WEBHOOK_URL=https://your-n8n-instance.com/webhook/order
   ```

**Example n8n Webhook URL:**
```
https://n8n.yourdomain.com/webhook/order
```
or
```
https://your-username.app.n8n.cloud/webhook/order
```

## How to Run

1. Set `WEBHOOK_URL` in backend `.env`
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Place an order with consent checkbox checked

## Webhook Payload Format

When an order is created with consent, the following data is sent to your webhook:

```json
{
  "orderId": "67890abcdef123456789",
  "customerName": "Ahmed Benali",
  "customerEmail": "ahmed@example.com",
  "customerPhone": "+212612345678",
  "products": [
    {
      "name": "Smartphone Alpha 5G",
      "quantity": 1,
      "price": 2500
    }
  ],
  "totalPrice": 2500,
  "shippingAddress": {
    "street": "123 Main Street",
    "city": "Casablanca",
    "state": "Casablanca-Settat",
    "zipCode": "20000",
    "country": "Morocco"
  },
  "whatsAppMessage": "Salam Ahmed! 👋\n\nBghiti n'akkd lik l-commande...",
  "whatsAppPrompt": "Generate a friendly, professional WhatsApp...",
  "emailSubject": "Order Confirmation - Order #67890abcdef",
  "emailBody": "Dear Ahmed,\n\nThank you for your order!...",
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

## Testing

1. Add products to cart
2. Go to checkout
3. Fill delivery info
4. Check "I agree to be contacted via WhatsApp and email"
5. Complete order
6. Check webhook receives data (check your n8n workflow or webhook testing service)

## Example WhatsApp Message (Moroccan Darija)

```
Salam Ahmed! 👋

Bghiti n'akkd lik l-commande dyalek: Smartphone Alpha 5G - Total: 2500 MAD.

Smartphone Alpha 5G 3andna fih quality b7al li bghiti w delivery b7al l-bari7! 🚀

T'akkd l-commande? Yallah n'jib lik l-7aja b7al li bghiti! ✅
```

## Example Email Template

Subject: `Order Confirmation - Order #12345`

Body includes order details, products, total, and shipping address.
