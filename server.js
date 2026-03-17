require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const PAYHERO_AUTH = process.env.PAYHERO_BASIC_AUTH; // Your "Basic cnN6..." token
const CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID; // Your Channel ID from Dashboard

// 1. M-PESA STK PUSH ROUTE
app.post('/api/stk-push', async (req, res) => {
    const { amount, phone, reference } = req.body;
    
    try {
        const response = await axios.post('https://backend.payhero.co.ke/api/v2/payments/external/stk', {
            amount: amount,
            phone_number: phone,
            channel_id: CHANNEL_ID,
            external_reference: reference || "Order_" + Date.now(),
            callback_url: "https://your-subdomain.com/api/callback" 
        }, {
            headers: { 'Authorization': PAYHERO_AUTH }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response?.data || "STK Push Failed" });
    }
});

// 2. CALLBACK ROUTE (Payhero hits this when payment is done)
app.post('/api/callback', (req, res) => {
    console.log("Payment Received:", req.body);
    // Here you would update your database (e.g., for King M bot or HustleSasa)
    res.sendStatus(200);
});

app.listen(3000, () => console.log('Payment Portal Live on Port 3000'));
