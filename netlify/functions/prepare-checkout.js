// This file uses require() which works with node-fetch v2.
const fetch = require('node-fetch');

// Get sensitive credentials from environment variables
const API_BASE_URL = "https://eu-test.oppwa.com";
const ENTITY_ID = process.env.HYPERPAY_ENTITY_ID;
const BEARER_TOKEN = process.env.HYPERPAY_BEARER_TOKEN;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // --- MODIFIED ---
        // We now receive the shopperResultUrl from the frontend
        const { amount, fname, lname, email, shopperResultUrl } = JSON.parse(event.body);

        if (!shopperResultUrl) {
            return { statusCode: 400, body: JSON.stringify({ error: 'shopperResultUrl is required' }) };
        }

        const data = new URLSearchParams();
        data.append("entityId", ENTITY_ID);
        data.append("amount", amount);
        data.append("currency", "SAR");
        data.append("paymentType", "DB");
        data.append("customer.surname", lname);
        data.append("customer.givenName", fname);
        data.append("customer.email", email);
        data.append("billing.country", "SA");
        data.append("billing.city", "Riyadh");
        data.append("billing.street1", "Riyadh");
        // --- ADDED ---
        // Pass the absolute redirect URL to HyperPay. This is best practice.
        data.append("shopperResultUrl", shopperResultUrl);

        const response = await fetch(`${API_BASE_URL}/v1/checkouts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data
        });
        const responseData = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(responseData),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};