require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Standard route for the UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Your Payhero STK Push Route
app.post('/api/stk-push', async (req, res) => {
    let { amount, phone } = req.body;
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    
    try {
        const response = await axios.post('https://backend.payhero.co.ke/api/v2/payments/external/stk', {
            amount: amount,
            phone_number: phone,
            channel_id: process.env.PAYHERO_CHANNEL_ID,
            external_reference: "Maka_" + Date.now(),
            callback_url: "https://paymaka.vercel.app/api/callback" 
        }, {
            headers: { 'Authorization': process.env.PAYHERO_BASIC_AUTH }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.response?.data?.message || "Internal Error" });
    }
});

// Export for Vercel (This is the most important line)
module.exports = app;
