require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// THE FIX: Explicitly tell Express to send index.html when someone visits "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- PAYHERO ENDPOINTS ---

const PAYHERO_AUTH = process.env.PAYHERO_BASIC_AUTH;
const CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;

// M-PESA STK PUSH
app.post('/api/stk-push', async (req, res) => {
    const { amount, phone } = req.body;
    
    try {
        const response = await axios.post('https://backend.payhero.co.ke/api/v2/payments/external/stk', {
            amount: amount,
            phone_number: phone,
            channel_id: CHANNEL_ID,
            external_reference: "Maka_" + Date.now(),
            callback_url: "https://paymaka-ke86v7l9j-mesuits-projects.vercel.app/api/callback" // UPDATE THIS to your live URL
        }, {
            headers: { 
                'Authorization': PAYHERO_AUTH,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("STK Error:", error.response?.data || error.message);
        res.status(500).json({ error: "STK Push Failed" });
    }
});

// CALLBACK (For Payhero to send results)
app.post('/api/callback', (req, res) => {
    console.log("Payment Callback Received:", req.body);
    res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Makamesco Portal running at http://localhost:${PORT}`);
});
