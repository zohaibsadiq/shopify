const axios = require('axios'); // Import Axios for making HTTP requests to external APIs

module.exports = async (req, res) => {
  try {
    // Check if the request method is POST, only POST requests are allowed
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const shopifyOrder = req.body; // Capture Shopify order data from the request body
    console.log('Received order from Shopify:', shopifyOrder);

    // Validate that necessary order data is present
    if (!shopifyOrder || !shopifyOrder.id || !shopifyOrder.line_items) {
      return res.status(400).json({ error: 'Invalid Shopify order data' });
    }

    // Map Shopify order details to the format required by Complies API
    const compliesOrder = {
      orderref: shopifyOrder.id.toString(), // Use Shopify order ID as the order reference
      ordertype: 'DS', // Set order type, e.g., 'DS' for Drop Shipment
      deliverymethod: '', // Set delivery method based on your logic if needed
      partialdelivery: 0, // Indicates whether partial delivery is allowed
      shipmentdate: new Date().toISOString(), // Current date as the shipment date
      recvcompanyname: shopifyOrder.shipping_address?.company || '-', // Recipient company name
      recvsurname: shopifyOrder.shipping_address?.last_name || '', // Recipient last name
      recvfirstname: shopifyOrder.shipping_address?.first_name || '', // Recipient first name
      recvinitials: shopifyOrder.shipping_address?.first_name?.charAt(0) || '', // Recipient initials
      recvstreet: shopifyOrder.shipping_address?.address1 || '', // Recipient street address
      recvhousenr: shopifyOrder.shipping_address?.address2 || '', // Recipient house number or additional address info
      recvzipcode: shopifyOrder.shipping_address?.zip || '', // Recipient postal code
      recvcity: shopifyOrder.shipping_address?.city || '', // Recipient city
      recvcountry: shopifyOrder.shipping_address?.country_code || '', // Recipient country code
      recvphone: shopifyOrder.shipping_address?.phone || '', // Recipient phone number
      recvemail: shopifyOrder.email || '', // Recipient email address
      items: shopifyOrder.line_items.map((item) => ({
        itemcode: item.sku || '', // Product SKU code
        quantity: item.quantity, // Quantity ordered
      })),
    };

    // Verify that all required environment variables are set
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

    // Retry logic for making API calls with specified retries and delay
    async function withRetry(apiCall, retries = 3, delay = 1000) {
      for (let i = 0; i < retries; i++) {
        try {
          return await apiCall(); // Attempt the API call
        } catch (err) {
          if (i === retries - 1) throw err; // Throw error if last attempt fails
          console.warn(`Retry ${i + 1}/${retries} failed: ${err.message}`);
          await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
        }
      }
    }

    // Send order data to Complies API with retry logic
    const compliesResponse = await withRetry(() =>
      axios.post('https://api.complies.nl/0/neworder', compliesOrder, {
        auth: {
          username: process.env.API_EMAIL, // API username from environment
          password: process.env.API_TOKEN, // API password from environment
        },
        timeout: 5000, // 5-second timeout for the request
      })
    );

    console.log('Order sent to Complies:', compliesResponse);

    // Extract delivery status from Complies API response
    const deliveryStatus = compliesResponse.data.statusText || 'Order Sent';

    // Prepare data to update the Shopify order note with the delivery status
    const shopifyUpdateData = {
      order: {
        id: shopifyOrder.id,
        note: `Delivery Status: ${deliveryStatus}`, // Append delivery status to the Shopify order note
      },
    };

    // Update Shopify order note with delivery status using retry logic
    const shopifyResponse = await withRetry(() =>
      axios.put(
        `https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2023-07/orders/${shopifyOrder.id}.json`,
        shopifyUpdateData,
        {
          headers: {
            'X-Shopify-Access-Token': process.env.SHOPIFY_PASSWORD, // Authorization token for Shopify
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5-second timeout for the request
        }
      )
    );

    console.log('Order note updated in Shopify:', shopifyResponse.data);

    // Respond with success message and API data
    res.status(200).json({
      message:
        'Order processed successfully and delivery status updated in Shopify order note',
      compliesData: compliesResponse.data,
      shopifyData: shopifyResponse.data,
    });
  } catch (err) {
    // Error handling for API issues and unexpected errors
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
