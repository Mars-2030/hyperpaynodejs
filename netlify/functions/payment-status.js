const fetch = require('node-fetch');

const API_BASE_URL = "https://eu-test.oppwa.com";
const ENTITY_ID = "8ac7a4c897bdb7700197c0c19d1c0488";
const BEARER_TOKEN = process.env.HYPERPAY_BEARER_TOKEN;

exports.handler = async (event) => {
    // Get the raw ID from the query parameter
    let { id } = event.queryStringParameters;

    // --- THIS IS THE CRITICAL FIX ---
    // The ID from the redirect can include transaction metadata after a dot.
    // We must clean it to get only the pure checkout ID before using it.
    if (id && id.includes('.')) {
        console.log("Cleaning raw ID from redirect:", id);
        id = id.split('.')[0];
        console.log("Using cleaned ID for status check:", id);
    }
    // --- END OF FIX ---

    if (!id || id === 'null' || id === 'undefined') {
        return {
            statusCode: 400,
            body: JSON.stringify({
                paymentStatus: "Failed",
                description: "Critical Error: Checkout ID was not provided to the status check.",
            }),
        };
    }
    
    const url = `${API_BASE_URL}/v1/checkouts/${id}/payment?entityId=${ENTITY_ID}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
        });
        const responseData = await response.json();

        console.log("Received response from HyperPay:", JSON.stringify(responseData, null, 2));

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
        console.error("Error fetching payment status:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};