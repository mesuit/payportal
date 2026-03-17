require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
// Using path.join with __dirname ensures Vercel finds the folder correctly
app.use(express.static(path.join(__dirname, 'public')));

// THE FIX FOR 404: Explicitly route the root to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- PAYHERO ENDPOINTS ---

// M-PESA STK PUSH
app.post('/api/stk-push', async (req, res) => {
    let { amount, phone } = req.body;

    // Validation: Ensure data exists
    if (!amount || !phone) {
        return res.status(400).json({ status: "Error", message: "Amount and Phone are required" });
    }

    // Auto-format phone to 2547XXXXXXXX
    phone = phone.trim();
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (phone.startsWith('+')) phone = phone.slice(1);

    try {
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
            timeout: 10000 // 10 second timeout for API response
        });

        res.json(response.data);
    } catch (error) {
        const errorData = error.response?.data;
        console.error("❌ Payhero API Error:", errorData || error.message);
        
        res.status(error.response?.status || 500).json({ 
            status: "Error", 
            message: errorData?.message || "Internal Server Error" 
        });
    }
});

// CALLBACK (For Payhero to send results)
app.post('/api/callback', (req, res) => {
    console.log("✅ Payment Callback Received:", req.body);
    // Add logic here to update your database (e.g., for King M bot)
    res.status(200).json({ status: "success", message: "Callback received" });
});

// VERCEL SPECIFIC: We do not use app.listen in production.
// This allows local testing but exports the app for Vercel.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Makamesco Portal running at http://localhost:${PORT}`);
    });
}

// CRITICAL: Export the app for Vercel's serverless handler
module.exports = app;
