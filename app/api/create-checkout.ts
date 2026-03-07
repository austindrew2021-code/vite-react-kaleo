// api/create-checkout.ts
// Vercel serverless function — must be named create-checkout.ts to match
// the frontend fetch('/api/create-checkout', ...) call.
import Stripe from 'stripe';

// API version must match stripe package major version (v20 = 2026-01-28.clover)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover' as any,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Frontend sends: { usdAmount, tokens, wallet, stage }
    const { usdAmount, tokens, wallet, stage } = req.body;

    // ── Validation ──────────────────────────────────────────────────────
    if (!usdAmount || !tokens || !wallet) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['usdAmount', 'tokens', 'wallet'],
      });
    }

    const usd = Number(usdAmount);
    if (isNaN(usd) || usd < 10) {
      return res.status(400).json({ error: 'Minimum purchase is $10' });
    }

    if (typeof tokens !== 'number' || tokens <= 0) {
      return res.status(400).json({ error: 'Tokens must be a positive number' });
    }

    // Accept EVM (0x...), Solana (base58, 32–44 chars), or BTC (bc1... / 1... / 3...)
    const isEvmWallet  = typeof wallet === 'string' && /^0x[0-9a-fA-F]{40}$/.test(wallet);
    const isSolWallet  = typeof wallet === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
    const isBtcWallet  = typeof wallet === 'string' && /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(wallet);
    if (!isEvmWallet && !isSolWallet && !isBtcWallet) {
      return res.status(400).json({ error: 'Invalid wallet address — provide an EVM, Solana, or Bitcoin address' });
    }

    // ── Stripe unit_amount is in CENTS ──────────────────────────────────
    const unitAmountCents = Math.round(usd * 100);

    const origin = req.headers.origin
      || (req.headers.host ? `https://${req.headers.host}` : 'https://kaleopresale.com');

    const successUrl =
      `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}` +
      `&wallet=${encodeURIComponent(wallet)}&tokens=${tokens}&usd=${usd}`;

    const cancelUrl = `${origin}/?canceled=true`;

    // ── Create Stripe Checkout Session ──────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Xenia (XEN) Presale — Stage ${stage || 'Current'}`,
              description: `${Number(tokens).toLocaleString()} XEN tokens · delivered at launch`,
              images: [`${origin}/logo.png`],
            },
            // unit_amount is CENTS — $1 = 100
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      metadata: {
        wallet,
        tokens:   tokens.toString(),
        usdAmount: usd.toString(),
        stage:    stage ? stage.toString() : 'unknown',
      },
    });

    // ── Return the Checkout URL so frontend can redirect ────────────────
    // session.url is the hosted Stripe Checkout page URL
    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Failed to create checkout session',
      code:  err.code   || 'internal_error',
    });
  }
}
