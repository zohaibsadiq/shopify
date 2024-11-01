const axios = require("axios");
const Shopify = require("shopify-api-node");
require("dotenv").config();


const shopify = new Shopify({
  shopName: process.env.SHOPIFY_SHOP_NAME,
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.API_PASSWORD
})

const createOrder = async () => {
  try {
    const order = await shopify.order.create({
      line_items: [
        {
          variant_id: 123456789, // Replace with your variant ID
          quantity: 1
        }
      ],
      customer: {
        id: 987654321 // Replace with your customer ID
      },
      billing_address: {
        first_name: 'John',
        last_name: 'Doe',
        address1: '123 Fake Street',
        phone: '555-555-5555',
        city: 'Fakecity',
        province: 'Ontario',
        country: 'Canada',
        zip: 'K2P 1L4'
      },
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        address1: '123 Fake Street',
        phone: '555-555-5555',
        city: 'Fakecity',
        province: 'Ontario',
        country: 'Canada',
        zip: 'K2P 1L4'
      },
      financial_status: 'paid'
    })
    console.log('Order created:', order)
  } catch (error) {
    console.error('Error creating order:', error)
  }
}

createOrder()