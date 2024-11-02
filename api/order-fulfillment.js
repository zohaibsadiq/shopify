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
      deliverymethod: '', // You may want to set a value based on your logic
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
    const missingEnv = [];
    if (!process.env.API_EMAIL) missingEnv.push('API_EMAIL');
    if (!process.env.API_TOKEN) missingEnv.push('API_TOKEN');
    if (!process.env.SHOPIFY_API_KEY) missingEnv.push('SHOPIFY_API_KEY');
    if (!process.env.SHOPIFY_SHOP_NAME) missingEnv.push('SHOPIFY_SHOP_NAME');
    if (!process.env.SHOPIFY_PASSWORD) missingEnv.push('SHOPIFY_PASSWORD');

    if (missingEnv.length) {
      console.error(`Missing environment variables: ${missingEnv.join(', ')}`);
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Retry logic function
    async function withRetry(apiCall, retries = 3, delay = 1000) {
      for (let i = 0; i < retries; i++) {
        try {
          return await apiCall();
        } catch (err) {
          if (i === retries - 1) throw err; // Rethrow if last attempt fails
          console.warn(`Retry ${i + 1}/${retries} failed: ${err.message}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Send order details to Complies API with retry logic
    const compliesResponse = await withRetry(() =>
      axios.post('https://api.complies.nl/0/neworder', compliesOrder, {
        auth: {
          username: process.env.API_EMAIL,
          password: process.env.API_TOKEN,
        },
        timeout: 5000, // Set a 5-second timeout
      })
    );

    console.log('Order sent to Complies:', compliesResponse.data);

    // Capture the delivery status from the Complies API response
    const deliveryStatus = compliesResponse.data.statusText || 'Order Sent';

    // Prepare data to update the Shopify order note with the delivery status
    const shopifyUpdateData = {
      order: {
        id: shopifyOrder.id,
        note: `Delivery Status: ${deliveryStatus}`, // This updates the order note
      },
    };

    // Shopify API call to update the order note with retry logic
    const shopifyResponse = await withRetry(() =>
      axios.put(
        `https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2023-07/orders/${shopifyOrder.id}.json`,
        shopifyUpdateData,
        {
          headers: {
            'X-Shopify-Access-Token': process.env.SHOPIFY_PASSWORD, // Use SHOPIFY_PASSWORD for access
            'Content-Type': 'application/json',
          },
          timeout: 5000, // Set a 5-second timeout
        }
      )
    );

    console.log('Order note updated in Shopify:', shopifyResponse.data);

    // Send back a success response
    res.status(200).json({
      message:
        'Order processed successfully and delivery status updated in Shopify order note',
      compliesData: compliesResponse.data,
      shopifyData: shopifyResponse.data,
    });
  } catch (err) {
    // Specific error handling for axios and other potential issues
    if (err.response) {
      console.error(
        `Complies API or Shopify API error on URL ${err.config?.url}:`,
        err.response.data
      );
      res.status(502).json({
        error: 'Failed to process order or update delivery status',
        details: err.response.data,
      });
    } else if (err.request) {
      console.error(
        'No response from Complies API or Shopify API:',
        err.message
      );
      res
        .status(504)
        .json({ error: 'No response from API', details: err.message });
    } else {
      console.error('Unexpected error:', err.message);
      res
        .status(500)
        .json({ error: 'Internal server error', details: err.message });
    }
  }
};
