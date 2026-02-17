import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, tokens, wallet, stage } = req.body;

    if (!amount || !tokens || !wallet) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Kaleo Presale Tokens - Stage ${stage}`,
              description: `${tokens} KLEO tokens`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `\( {req.headers.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}&wallet= \){wallet}&tokens=${tokens}`,
      cancel_url: `${req.headers.origin}/`,
      metadata: { wallet, tokens: tokens.toString(), stage },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (err: any) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
