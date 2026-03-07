import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2026-01-28.clover',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, tokens, wallet, stage } = req.body;

    // Validate required fields
    if (!amount || !tokens) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['amount', 'tokens'],
        received: { amount, tokens, wallet },
      });
    }

    // amount is in cents (e.g. $10.00 = 1000)
    const unitAmount = Math.round(Number(amount));
    if (isNaN(unitAmount) || unitAmount < 1000) {  // minimum $10
      return res.status(400).json({ error: 'Amount must be at least $10 (1000 cents)' });
    }

    const tokenCount = Number(tokens);
    if (isNaN(tokenCount) || tokenCount <= 0) {
      return res.status(400).json({ error: 'Tokens must be a positive number' });
    }

    // wallet is optional — some users may not have connected yet.
    // Accept EVM (0x...), Solana (base58, 32-44 chars), BTC (bc1..., 1..., 3...)
    // or the zero-address placeholder. Just store whatever was sent.
    const walletAddr = typeof wallet === 'string' ? wallet.trim() : '';

    const usdDisplay = (unitAmount / 100).toFixed(2);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Xenia Presale Tokens — Stage ${stage || 'Current'}`,
              description: `${Number(tokenCount).toLocaleString()} XEN tokens at $${usdDisplay}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}&wallet=${encodeURIComponent(walletAddr)}&tokens=${tokenCount}&usd=${usdDisplay}`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      metadata: {
        wallet: walletAddr,
        tokens: tokenCount.toString(),
        usd: usdDisplay,
        stage: stage ? stage.toString() : 'unknown',
      },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (err: any) {
    console.error('Stripe checkout session creation failed:', err);
    const status = err.statusCode || 500;
    return res.status(status).json({
      error: err.message || 'Failed to create checkout session',
      code: err.code || 'internal_error',
      type: err.type || 'unknown',
    });
  }
}
