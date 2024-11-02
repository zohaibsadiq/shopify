const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Check if the request method is POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const shopifyOrder = req.body;
    console.log('Received order from Shopify:', shopifyOrder);

    // Check if the order data is present
    if (!shopifyOrder || !shopifyOrder.id || !shopifyOrder.line_items) {
      return res.status(400).json({ error: 'Invalid Shopify order data' });
    }

    // Map Shopify order data to Complies API fields
    const compliesOrder = {
      orderref: shopifyOrder.id.toString(),
      ordertype: 'DS',
      deliverymethod: '',
      partialdelivery: 0,
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
        itemcode: item.sku || '',
        quantity: item.quantity,
      })),
    };

    // Verify that environment variables are present
    if (!process.env.API_EMAIL || !process.env.API_TOKEN) {
      console.error('API_EMAIL or API_TOKEN environment variable is missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Send order details to Complies API
    const response = await axios.post(
      'https://api.complies.nl/0/neworder',
      compliesOrder,
      {
        auth: {
          username: process.env.API_EMAIL,
          password: process.env.API_TOKEN,
        },
      }
    );

    console.log('Order sent to Complies:', response);
    res
      .status(200)
      .json({ message: 'Order processed successfully', data: response.data });
  } catch (err) {
    // Specific error handling for axios and other potential issues
    if (err.response) {
      console.error('Complies API error:', err.response.data);
      res.status(502).json({
        error: 'Failed to send order to Complies',
        details: err.response.data,
      });
    } else if (err.request) {
      console.error('No response from Complies API:', err.message);
      res
        .status(504)
        .json({ error: 'No response from Complies API', details: err.message });
    } else {
      console.error('Unexpected error:', err.message);
      res
        .status(500)
        .json({ error: 'Internal server error', details: err.message });
    }
  }
};
