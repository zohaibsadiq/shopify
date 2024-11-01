const axios = require('axios');
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const shopifyOrder = req.body;

    console.log('Received order from Shopify:', shopifyOrder);

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

    try {
      const response = await axios.post(
        'https://api.complies.nl/0/neworder',
        compliesOrder,
        {
          auth: {
            email: process.env.API_EMAIL,
            password: process.env.API_TOKEN,
          },
        }
      );
      console.log('Order sent to Complies:', response.data);
      res.status(200).send('Order processed successfully.');
    } catch (err) {
      console.error(
        'Error sending order to Complies:',
        err.response ? err.response.data : err.message
      );
      res.status(500).send('Failed to process order.');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
};
