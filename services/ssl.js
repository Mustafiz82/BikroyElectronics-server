import SSLCommerzPayment from 'sslcommerz-lts';

export const initSSLPayment = async (orderId, ordersData, cartIDs) => {
  const { customerDetail, cartData, totalPrice } = ordersData;
  const encodedCartIds = encodeURIComponent(JSON.stringify(cartIDs));

  const paymentData = {
    total_amount: totalPrice,
    currency: "BDT",
    tran_id: orderId,
    success_url: `https://bikroyelectronics-server.vercel.app/payment/ssl-success/${orderId}?cartIds=${encodedCartIds}`,
    fail_url: `https://bikroyelectronics-server.vercel.app/payment/ssl-fail/${orderId}`,
    cancel_url: `https://bikroyelectronics-server.vercel.app/payment/ssl-cancel/${orderId}`,
    ipn_url: `https://bikroyelectronics-server.vercel.app/payment/ssl-ipn?cartIds=${encodedCartIds}`,
    shipping_method: "Courier",
    product_name: cartData.map(item => item.title).join(", ") || "Order Items",
    product_category: "Retail",
    product_profile: "general",
    cus_name: customerDetail.name || "Customer Name",
    cus_email: customerDetail.email.toLowerCase(),
    cus_add1: customerDetail.address || "Dhaka",
    cus_add2: "Dhaka",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: customerDetail.PhoneNumber || "01700000000",
    cus_fax: customerDetail.PhoneNumber,
    ship_name: customerDetail.name,
    ship_add1: customerDetail.address,
    ship_add2: "Dhaka",
    ship_city: "Dhaka",
    ship_state: "Dhaka",
    ship_postcode: "1000",
    ship_country: "Bangladesh"
  };

  const sslcz = new SSLCommerzPayment(
    process.env.SSL_STORE_ID,
    process.env.SSL_STORE_PASS,
    false // is_live
  );

  const apiResponse = await sslcz.init(paymentData);
  return apiResponse.GatewayPageURL;
};