import React, { useState, useEffect } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useSearchParams,
} from 'react-router-dom';
import './App.css'; // Make sure you have this CSS file for styling

function PaymentForm() {
    const [formData] = useState({
        amount: 100,
        fname: "Iam",
        lname: "Client",
        email: "info@email.net",
    });
    const [checkoutId, setCheckoutId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (checkoutId) {
            window.wpwlOptions = {
                applePay: {
                      displayName: "Spectrum Clinics",
                      total: { label: "Spectrum Clinics" },
                      supportedNetworks: ["masterCard", "visa", "mada"],
                      supportedCountries: ["SA"],
                    currencyCode: "SAR",
                    merchantIdentifier: "merchant.clinic.com",
                    onPaymentAuthorized: function(payment) {
                    console.log("Apple Pay authorized:", payment);
                    // Signal success to the widget to proceed
                    return Promise.resolve({
                        status: "SUCCESS"
                    });
                }
                }
            };
            const script = document.createElement('script');
            script.src = `https://eu-test.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}`;
            script.async = true;
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
                const wpwlFrame = document.querySelector('.wpwl-iframe');
                if (wpwlFrame) wpwlFrame.remove();
            };
        }
    }, [checkoutId]);

    const handlePrepareCheckout = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Create the full, absolute URL for the redirect
            const redirectUrl = `${window.location.origin}/status`;

            const response = await fetch('/api/prepare-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send the form data AND the absolute redirect URL to our backend
                body: JSON.stringify({ ...formData, shopperResultUrl: redirectUrl }),
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

            const data = await response.json();
            if (data.id) {
                setCheckoutId(data.id);
            } else {
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
            <hr />
            {!checkoutId ? (
                <button onClick={handlePrepareCheckout} disabled={isLoading}>
                    {isLoading ? 'Preparing...' : 'Proceed to Payment'}
                </button>
            ) : (
                <div>
                    <h3>Complete Your Payment</h3>
                    {/* --- FIXED ---
                        The `action` attribute has been completely removed.
                        The HyperPay widget will now automatically use the shopperResultUrl
                        that you provided when the checkout ID was created.
                    */}
                    <form className="paymentWidgets" data-brands="VISA MASTER MADA APPLEPAY"></form>
                </div>
            )}
            {error && <p className="error-message">Error: {error}</p>}
        </div>
    );
}

// PaymentStatus and App components remain unchanged.
function PaymentStatus() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('Verifying...');
    const [description, setDescription] = useState('Please wait while we confirm your transaction.');

    useEffect(() => {
        const checkoutId = searchParams.get('id');
        if (!checkoutId) {
            setStatus('Failed');
            setDescription('Error: No payment ID was found. Cannot verify status.');
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await fetch(`/api/payment-status?id=${checkoutId}`);
                const data = await response.json();
                setStatus(data.paymentStatus || 'Failed');
                setDescription(data.description || 'Could not retrieve payment details.');
                if (data.paymentStatus) {
                    window.location.replace(`bbuser://${data.paymentStatus}`);
                }
            } catch (err) {
                console.error("Payment verification failed:", err);
                setStatus('Failed');
                setDescription('An error occurred while trying to verify your payment status.');
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="container">
            <h1>Payment Status</h1>
            <h2 className={`status-${status.toLowerCase()}`}>{status}</h2>
            <p>{description}</p>
            <p className="arabic-text"> please wait while we verify your payment...</p>
            {status === "Verifying..." && <div className="spinner"></div>}
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<PaymentForm />} />
                <Route path="/status" element={<PaymentStatus />} />
            </Routes>
        </Router>
    );
}

export default App;
