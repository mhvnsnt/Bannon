const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// Find the section where we import express and add stripe
const expressImportRegex = /import express from "express";/;
content = content.replace(expressImportRegex, `import express from "express";\nimport Stripe from "stripe";`);

// Find the line where app is created
const appInitRegex = /const app = express\(\);/;
content = content.replace(appInitRegex, `const app = express();
const stripeClient = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) : null;

// Stripe Webhook needs raw body parsing
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  if (!stripeClient) {
    return res.status(400).send('Stripe not configured.');
  }
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout completed for user:', session.client_reference_id);
      // Here you would update the token balance in Supabase for the user
      // supabase.from('profiles').update({ role: 'pro', tokens: 2000000 }).eq('id', session.client_reference_id);
      break;
    default:
      console.log(\`Unhandled event type \${event.type}\`);
  }
  res.json({received: true});
});`);

fs.writeFileSync(file, content);
console.log("Patched server for Stripe!");
