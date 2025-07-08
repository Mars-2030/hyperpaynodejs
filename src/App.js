import React, { useState, useEffect } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useSearchParams,
} from 'react-router-dom';

// It's good practice to include some basic styling.
// You would create this file in the same `src/` directory.
import './App.css';

// ====================================================================
// Component to Render the Payment Form (replaces file 1 logic)
// ====================================================================
function PaymentForm() {
    // State for user data, checkout ID from API, and loading/error states
    const [formData] = useState({
        amount: 500,
        fname: "Beauty",
        lname: "Client",
        email: "info@email.net",
    });
    const [checkoutId, setCheckoutId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // This effect runs ONLY when the checkoutId is successfully fetched.
    // It is responsible for loading the external HyperPay payment widget script.
    useEffect(() => {
        if (checkoutId) {
            // HyperPay requires this global object to be set before the script loads.
            window.wpwlOptions = {
                applePay: {
                    displayName: "test",
                    total: { label: "test, INC." },
                    supportedNetworks: ["masterCard", "visa"]
                }
            };
            
            const script = document.createElement('script');
            script.src = `https://eu-test.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}`;
            script.async = true;
            document.body.appendChild(script);

            // Cleanup function: This is important for React. It removes the script
            // and the payment widget's iframe when the component is unmounted
            // to prevent memory leaks and unexpected behavior.
            return () => {
                document.body.removeChild(script);
                const wpwlFrame = document.querySelector('.wpwl-iframe');
                if (wpwlFrame) {
                    wpwlFrame.remove();
                }
            };
        }
    }, [checkoutId]); // Dependency array: this effect re-runs if checkoutId changes

    // Function to call our backend (Netlify Function) to prepare the checkout
    const handlePrepareCheckout = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // The URL '/api/prepare-checkout' is a relative path that Netlify
            // will redirect to your serverless function.
            const response = await fetch('/api/prepare-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.id) {
                setCheckoutId(data.id);
            } else {
                // Handle errors returned by the HyperPay API itself
                setError(data.result?.description || 'Failed to get a valid checkout ID.');
            }
        } catch (err) {
            console.error("API call failed:", err);
            setError('Could not connect to the payment server. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>Payment Details</h1>
            <div className="info-box">
                <p><strong>Client:</strong> {formData.fname} {formData.lname}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Amount:</strong> {formData.amount} SAR</p>
            </div>
            <hr/>
            
            {/* Conditional Rendering: Show button OR payment form */}
            {!checkoutId ? (
                <button onClick={handlePrepareCheckout} disabled={isLoading}>
                    {isLoading ? 'Preparing...' : 'Proceed to Payment'}
                </button>
            ) : (
                <div>
                    <h3>Complete Your Payment</h3>
                    {/* This form is where the HyperPay widget will be rendered.
                        The action URL points to our status page within the React app.
                        HyperPay will redirect the user to this URL after payment. */}
                    <form action="/status" className="paymentWidgets" data-brands="VISA MASTER"></form>
                </div>
            )}

            {error && <p className="error-message">Error: {error}</p>}
        </div>
    );
}

// ====================================================================
// Component to show Payment Status (replaces file 2 logic)
// ====================================================================
function PaymentStatus() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('Verifying...');
    const [description, setDescription] = useState('Please wait while we confirm your transaction.');
    
    // This effect runs once when the component loads to verify the payment.
    useEffect(() => {
        const checkoutId = searchParams.get('id');
        
        if (!checkoutId) {
             setStatus('Failed');
             setDescription('Error: No payment ID was found. Cannot verify status.');
             return;
        }

        const verifyPayment = async () => {
            try {
                // Call our backend (Netlify Function) to get the final status
                const response = await fetch(`/api/payment-status?id=${checkoutId}`);
                const data = await response.json();
                
                setStatus(data.paymentStatus || 'Failed');
                setDescription(data.description || 'Could not retrieve payment details.');

                // This is the key part for mobile app integration.
                // It attempts to open your custom app URL scheme.
                if (data.paymentStatus) {
                    console.log(`Redirecting to mobile app: bbuser://${data.paymentStatus}`);
                    window.location.replace(`bbuser://${data.paymentStatus}`);
                }
                
            } catch (err) {
                console.error("Payment verification failed:", err);
                setStatus('Failed');
                setDescription('An error occurred while trying to verify your payment status.');
            }
        };

        verifyPayment();
    }, [searchParams]); // Dependency array ensures this runs if the URL params change

    return (
        <div className="container">
            <h1>Payment Status</h1>
            <h2 className={`status-${status.toLowerCase()}`}>{status}</h2>
            <p>{description}</p>
            <p className="arabic-text">الرجاء الانتظار لحين اكتمال عملية الشراء</p>
            {status === "Verifying..." && <div className="spinner"></div>}
            <p>(If you are not redirected automatically, please return to the app.)</p>
        </div>
    );
}

// ====================================================================
// Main App Component with Router
// ====================================================================
function App() {
    return (
        <Router>
            <Routes>
                {/* Route for the initial payment page */}
                <Route path="/" element={<PaymentForm />} />
                
                {/* Route for the status/callback page */}
                <Route path="/status" element={<PaymentStatus />} />
            </Routes>
        </Router>
    );
}

export default App;