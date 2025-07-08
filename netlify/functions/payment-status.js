const fetch = require('node-fetch');

// These constants must be defined in this file to be used.
const API_BASE_URL = "https://eu-test.oppwa.com";
const ENTITY_ID = "8ac7a4c897bdb7700197c0c19d1c0488";
const BEARER_TOKEN = process.env.HYPERPAY_BEARER_TOKEN;

exports.handler = async (event) => {
    const { id } = event.queryStringParameters;

    console.log("Attempting to verify payment status for checkout ID:", id);

    if (!id || id === 'null' || id === 'undefined') {
        console.error("Error: The checkout ID is missing or invalid.");
        return {
            statusCode: 400,
            body: JSON.stringify({
                paymentStatus: "Failed",
                description: "Critical Error: Checkout ID was not provided to the status check.",
            }),
        };
    }
    
    // Now API_BASE_URL and ENTITY_ID are defined and this line will work
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