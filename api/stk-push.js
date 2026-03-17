const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let { amount, phone } = req.body;

    // Fix phone format (07... -> 2547...)
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    phone = phone.replace(/\D/g, ''); 

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

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ 
            status: "Error", 
            message: error.response?.data?.message || "Payhero API unreachable" 
        });
    }
}
