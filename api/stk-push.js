const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    let { amount, phone } = req.body;

    // Format phone
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    phone = phone.replace(/\D/g, ''); // Remove any non-digits

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
            }
        });

        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Payhero Error:", error.response?.data || error.message);
        return res.status(500).json({ 
            status: "Error", 
            message: error.response?.data?.message || "Check Vercel Logs for details" 
        });
    }
}
