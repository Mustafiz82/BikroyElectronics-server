import Stripe from 'stripe';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

// 1. Initialize Stripe Checkout Session
export const createStripeSession = async (req, res) => {
  try {
    const ordersData = req.body;
    const { customerDetail, cartData } = ordersData;

    // Create a pending order first
    const newOrder = new Order(ordersData);
    const orderResult = await newOrder.save();
    const orderId = orderResult._id.toString();

    // Map cart items into Stripe line items (Price is multiplied by 100 to convert BDT to Poisha)
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

    // Extract cart IDs to delete later in the webhook
    const cartIDs = cartData.map(item => item._id || item.cartID);

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      metadata: {
        orderID: orderId,
        cartIDs: JSON.stringify(cartIDs),
        email: customerDetail.email.toLowerCase()
      },
      mode: "payment",
      success_url: "http://localhost:3000/payment/success",
      cancel_url: `http://localhost:3000/payment/cancel?orderId=${orderId}`
    });

    res.status(201).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Stripe initialization failed", error: error.message });
  }
};

// 2. Stripe raw Webhook Handler
export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Requires the raw request body Buffer to verify signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkouts
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { orderID, cartIDs, email } = session.metadata;

    try {
      // Update order status to completed via Mongoose
      await Order.findByIdAndUpdate(orderID, {
        $set: { paymentStatus: 'completed' }
      });
      console.log(`✅ Order ${orderID} payment updated to completed via Stripe Webhook`);

      // Clear the user's cart in Mongoose
      if (cartIDs) {
        const parsedCartIds = JSON.parse(cartIDs);
        await Cart.deleteMany({ _id: { $in: parsedCartIds } });
        console.log(`🗑️ Cleared cart for ${email}`);
      }
    } catch (dbError) {
      console.error("Error updating order in webhook:", dbError.message);
    }
  }

  res.json({ received: true });
};