// api/create-checkout-session.ts
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
  // In production Vercel will catch this and return 500 automatically
}

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2026-01-28.clover',
});

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, tokens, wallet, stage } = req.body;

    // Basic input validation
    if (!amount || !tokens || !wallet) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['amount', 'tokens', 'wallet']
      });
    }

    const unitAmount = Math.round(Number(amount));
    if (isNaN(unitAmount) || unitAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (typeof tokens !== 'number' || tokens <= 0) {
      return res.status(400).json({ error: 'Tokens must be a positive number' });
    }

    if (typeof wallet !== 'string' || !wallet.startsWith('0x') || wallet.length !== 42) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Kaleo Presale Tokens - Stage ${stage || 'Current'}`,
              description: `${tokens.toLocaleString()} KLEO tokens`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `\( {req.headers.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}&wallet= \){encodeURIComponent(wallet)}&tokens=${tokens}`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      metadata: {
        wallet,
        tokens: tokens.toString(),
        stage: stage ? stage.toString() : 'unknown',
      },
    });

    // Return session ID to frontend so it can redirect to Stripe
    return res.status(200).json({ sessionId: session.id });
  } catch (err: any) {
    console.error('Stripe checkout session creation failed:', err);

    const status = err.statusCode || 500;
    const message = err.message || 'Failed to create checkout session';

    return res.status(status).json({
      error: message,
      code: err.code || 'internal_error',
      type: err.type || 'unknown',
    });
  }
}
