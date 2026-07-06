const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Remove duplicate Stripe import
content = content.replace("import Stripe from 'stripe';\n", "");

// Fix stripeClientInstance
content = content.replace(
  "event = stripeClientInstance.webhooks.constructEvent(req.body, sig, endpointSecret);",
  "const stripe = getStripeClient();\n    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);"
);

fs.writeFileSync('server.ts', content);
