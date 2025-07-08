const fetch = require('node-fetch');

// ... your constants (API_BASE_URL, ENTITY_ID, BEARER_TOKEN) ...

exports.handler = async (event) => {
    // Get the ID from the query parameters sent by the frontend
    const { id } = event.queryStringParameters;

    // --- ADD THIS LOGGING LINE ---
    // This will show up in your Netlify function logs.
    console.log("Attempting to verify payment status for checkout ID:", id);

    // --- ADD THIS CHECK ---
    // A specific check to see if the ID is missing or invalid
    if (!id || id === 'null' || id === 'undefined') {
        console.error("Error: The checkout ID is missing or invalid.");
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({
                paymentStatus: "Failed",
                description: "Critical Error: Checkout ID was not provided to the status check.",
            }),
        };
    }
    
    const url = `${API_BASE_URL}/v1/checkouts/${id}/payment?entityId=${ENTITY_ID}`;

    try {
        // ... rest of your function remains the same ...
        const response = await fetch(url, {
            // ...
        });
        const responseData = await response.json();

        // Add a log to see what HyperPay returned
        console.log("Received response from HyperPay:", JSON.stringify(responseData, null, 2));

        const resultCode = responseData.result?.code || '';
        // ... rest of the logic ...
        
        let paymentStatus = "Failed";
        if (/*...your patterns...*/ /^(000\.000\.|000\.100\.1|000\.[36])/.test(resultCode) || /^(000\.400\.0[^3]|000\.400\.[0-1]{2}0)/.test(resultCode)) {
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