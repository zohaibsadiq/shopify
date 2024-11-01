const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Endpoint to receive Shopify order creation webhook
app.post('/webhooks/order/fulfillment', async (req, res) => {
  const shopifyOrder = req.body; // The order object sent by Shopify

  console.log('Received order from Shopify:', shopifyOrder);

  // Map Shopify order data to Complies API fields
  const compliesOrder = {
    orderref: shopifyOrder.id.toString(),
    ordertype: 'EX', // Example value, use "DS" if dropshipping
    deliverymethod: '',
    partialdelivery: 0, // 1 if partial delivery allowed
    shipmentdate: new Date().toISOString(),
    recvcompanyname: shopifyOrder.shipping_address?.company || '-',
    recvsurname: shopifyOrder.shipping_address?.last_name || '',
    recvfirstname: shopifyOrder.shipping_address?.first_name || '',
    recvinitials: shopifyOrder.shipping_address?.first_name?.charAt(0) || '',
    recvstreet: shopifyOrder.shipping_address?.address1 || '',
    recvhousenr: shopifyOrder.shipping_address?.address2 || '',
    recvzipcode: shopifyOrder.shipping_address?.zip || '',
    recvcity: shopifyOrder.shipping_address?.city || '',
    recvcountry: shopifyOrder.shipping_address?.country_code || '',
    recvphone: shopifyOrder.shipping_address?.phone || '',
    recvemail: shopifyOrder.email || '',
    items: shopifyOrder.line_items.map((item) => ({
      itemcode: item.sku,
      description: item.title,
      quantity: item.quantity,
    })),
  };

  try {
    // Send order details to Complies API
    const response = await axios.post(
      'https://api.complies.nl/0/neworder',
      compliesOrder,
      {
        auth: {
          email: process.env.API_EMAIL, // Assumes API_EMAIL is username
          password: process.env.API_TOKEN, // Assumes API_TOKEN is password
        },
      }
    );
    console.log('Order sent to Complies:', response.data);
    res.status(200).send('Order processed successfully.');
  } catch (err) {
    console.error('Error sending order to Complies:', err.message);
    res.status(500).send('Failed to process order.');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
