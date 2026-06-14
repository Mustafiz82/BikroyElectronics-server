import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createStripeSession = async (orderId, cartData, customerDetail) => {
  const lineItems = cartData.map(item => ({
    price_data: {
      currency: "bdt",
      product_data: {
        name: item.title,
        images: item.imageUrl
      },
      unit_amount: Math.round((item.discountedPrice || item.price) * 100)
    },
    quantity: item.quantity
  }));

  const cartIDs = cartData.map(item => item._id || item.cartID);

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    metadata: {
      orderID: orderId,
      cartIDs: JSON.stringify(cartIDs),
      email: customerDetail.email.toLowerCase()
    },
    mode: "payment",
    success_url: "https://bikroyelectronics.web.app/payment/success",
    cancel_url: `https://bikroyelectronics.web.app/payment/cancel?orderId=${orderId}`
  });

  return session.url;
};