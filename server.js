require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// 1. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve static files (Your UI)
// Vercel handles the 'public' folder automatically, but this ensures 
// the root "/" always loads your index.html
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. M-PESA STK PUSH ROUTE
app.post('/api/stk-push', async (req, res) => {
    let { amount, phone } = req.body;

    // Validation
    if (!amount || !phone) {
        return res.status(400).json({ status: "Error", message: "Missing amount or phone" });
    }

    // Auto-format phone to 2547XXXXXXXX
    phone = phone.trim();
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (phone.startsWith('+')) phone = phone.slice(1);

    try {
        console.log(`Initiating payment for ${phone} - Ksh ${amount}`);

        const response = await axios.post('https://backend.payhero.co.ke/api/v2/payments/external/stk', {
            amount: amount,
            phone_number: phone,
            channel_id: process.env.PAYHERO_CHANNEL_ID,
            external_reference: "Maka_" + Date.now(),
            callback_url: "https://paymaka.vercel.app/api/callback" 
        }, {
            headers: { 
                'Authorization': process.env.PAYHERO_BASIC_AUTH,
                'Content-Type': 'application/json'
            },
            timeout: 10000 
        });

        // Send Payhero's response back to your frontend
        res.status(200).json(response.data);

    } catch (error) {
        // This log is what you check in Vercel Dashboard > Logs
        const errorData = error.response?.data;
        console.error("❌ Payhero API Error:", errorData || error.message);
        
        res.status(500).json({ 
            status: "Error", 
            message: errorData?.message || "Payment Provider Unreachable" 
        });
    }
});

// 4. CALLBACK ROUTE
app.post('/api/callback', (req, res) => {
    console.log("✅ Payment Notification:", req.body);
    res.status(200).json({ status: "success" });
});

// 5. VERCEL EXPORT (The Fix for the Nonsense)
// We only 'listen' if running locally. Vercel ignores this part.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
}

module.exports = app;
