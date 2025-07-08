const fetch = require('node-fetch');

const API_BASE_URL = "https://eu-test.oppwa.com";
const ENTITY_ID = "8ac7a4c897bdb7700197c0c19d1c0488";
const BEARER_TOKEN = process.env.HYPERPAY_BEARER_TOKEN;

exports.handler = async (event) => {
    const { id } = event.queryStringParameters;

    if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Checkout ID is required' }) };
    }

    const url = `${API_BASE_URL}/v1/checkouts/${id}/payment?entityId=${ENTITY_ID}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
        });
        const responseData = await response.json();

        const resultCode = responseData.result?.code || '';
        const pattern1 = /^(000\.000\.|000\.100\.1|000\.[36])/;
        const pattern2 = /^(000\.400\.0[^3]|000\.400\.[0-1]{2}0)/;

        let paymentStatus = "Failed";
        if (pattern1.test(resultCode) || pattern2.test(resultCode)) {
            paymentStatus = "Success";
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                paymentStatus,
                description: responseData.result?.description || 'No description available.',
            }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};