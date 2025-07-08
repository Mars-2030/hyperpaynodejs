// netlify/functions/prepare-checkout.js
const fetch = require('node-fetch');

const API_BASE_URL = "https://eu-test.oppwa.com";
const ENTITY_ID = "8ac7a4c897bdb7700197c0c19d1c0488";
// Get the Bearer Token from environment variables for security
const BEARER_TOKEN = process.env.HYPERPAY_BEARER_TOKEN;

exports.handler = async (event) => {
    // Netlify functions are triggered by HTTP events.
    // We only want to handle POST requests for this function.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { amount, fname, lname, email } = JSON.parse(event.body);

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