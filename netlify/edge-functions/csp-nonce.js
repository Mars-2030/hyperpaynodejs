import crypto from "node:crypto"; // Use Node's crypto for random generation

export default async (request, context) => {
  // Get the original response (your index.html)
  const response = await context.next();

  // Generate a unique nonce for this request
  const nonce = crypto.randomBytes(16).toString("base64");

  // Clone the response to modify headers and body
  const page = await response.text();

  // --- Option A: Inject nonce via a meta tag (easier) ---
  // Replace a placeholder in your public/index.html
  // Add <meta name="csp-nonce" content="%CSP_NONCE%"> in your index.html's <head>
  const updatedPage = page.replace('%CSP_NONCE%', nonce);

  // --- Option B: Inject nonce via a script tag (alternative) ---
  // const nonceScript = `<script nonce="${nonce}">window.NONCE_ID='${nonce}';</script>`;
  // const updatedPage = page.replace('</body>', `${nonceScript}</body>`);
  // NOTE: This inline script ALSO needs the nonce to execute!

  // Clone response to set headers
  const newResponse = new Response(updatedPage, response);
  newResponse.headers.set("Content-Type", "text/html");

  // Construct your CSP string including the generated nonce
  const csp = `
    default-src 'self';
    script-src 'self' https://eu-test.oppwa.com 'nonce-${nonce}';
    style-src 'self' https://eu-test.oppwa.com 'unsafe-inline';
    frame-src 'self' https://eu-test.oppwa.com;
    connect-src 'self' https://eu-test.oppwa.com *.netlify.app;
    img-src 'self' https://eu-test.oppwa.com data:;
    worker-src 'self' blob:;
  `.replace(/\s{2,}/g, ' ').trim(); // Clean up whitespace

  newResponse.headers.set("Content-Security-Policy", csp);

  // Optional: Add other security headers
  // newResponse.headers.set("X-Frame-Options", "DENY");
  // newResponse.headers.set("X-Content-Type-Options", "nosniff");

  return newResponse;
};
