const axios = require("axios");
const Shopify = require("shopify-api-node");
require("dotenv").config();

// Initialize Shopify
const shopify = new Shopify({
  shopName: process.env.SHOPIFY_SHOP_NAME,
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_PASSWORD,
});

// Mock order data (you can replace it with real order data)
const mockOrder = {
  quantity: 1,
  orderedByName: "John Doe",
  orderedByAddress: "123 Test Street",
  orderedByCity: "Test City",
  orderedByZipCode: "1234AA", // Adjusted to the correct format for NL
  orderedByCountry: "NL",
  orderedByEmail: "john@example.com",
  orderedByPhone: "123456789",
  customerName: "Jane Doe",
  customerAddress: "456 Test Avenue",
  customerCity: "Test City",
  customerZipCode: "1234AA", // Adjusted to the correct format for NL
  customerCountry: "NL",
  customerEmail: "jane@example.com",
  customerPhone: "123456789",
};

// Function to create an order in Shopify
async function createShopifyOrder(order) {
  try {
    const newOrder = await shopify.order.create({
      line_items: [
        {
          variant_id: 49579396759891, // Use the actual product variant ID
          quantity: order.quantity, // Use the quantity from the mock order
        },
      ],
      billing_address: {
        first_name: order.orderedByName.split(' ')[0], // First name
        last_name: order.orderedByName.split(' ')[1], // Last name
        address1: order.orderedByAddress,
        city: order.orderedByCity,
        province: '',
        country: order.orderedByCountry,
        zip: order.orderedByZipCode,
        phone: order.orderedByPhone,
      },
      shipping_address: {
        first_name: order.customerName.split(' ')[0], // First name
        last_name: order.customerName.split(' ')[1], // Last name
        address1: order.customerAddress,
        city: order.customerCity,
        province: '',
        country: order.customerCountry,
        zip: order.customerZipCode,
        phone: order.customerPhone,
      },
      email: order.customerEmail,
    });
    
    console.log("Shopify Order Created:", newOrder);
    return newOrder; // Return the created order
  } catch (error) {
    console.error("Error creating order in Shopify:", error.response?.data || error.message);
    throw error; // Rethrow the error to handle it in the main function
  }
}

// Function to send order details to Complies
async function sendOrderToComplies(order) {
  const url = "https://api.complies.nl/0/neworder"; // Replace with your actual Complies endpoint

  // Ensure all required fields are set
  const orderDetails = {
    recvcompanyname: "Company Name", // Replace with actual company name
    recvsurname: order.shipping_address.last_name || "Doe", // Required last name
    recvfirstname: order.shipping_address.first_name || "John", // Required first name
    recvstreet: order.shipping_address.address1 || "123 Test Street", // Required street address
    recvzipcode: order.shipping_address.zip || "1234AA", // Correct format for NL
    recvcity: order.shipping_address.city || "Test City", // Required city
    recvcountry: "NL", // Explicitly set to NL
    ordertype: "AS", // Replace with a valid order type
    items: [
      {
        itemcode: "49579396759891" , // Use the correct product variant ID
        description: "Zotac RTX 4090 OC 24GB", // Shortened description to meet character limit
        quantity: 1, // Use the quantity
        price: 1783.05, // Use the actual price from the product variant
      }
    ]
  };

  // Log the order details for debugging
  console.log("Sending the following order details to Complies:", orderDetails);

  try {
    const response = await axios.post(url, orderDetails, {
      auth: {
        username: process.env.API_EMAIL, // Use username instead of email
        password: process.env.API_PASSWORD,
      },
    });
    console.log("Order details sent to Complies:", response.data);
  } catch (error) {
    console.error("Error sending order to Complies:", error.response?.data || error.message);
  }
}

// Main function to process the order
async function main() {
  try {
    const order = await createShopifyOrder(mockOrder); // Call the newly defined function
    await sendOrderToComplies(order); // Send order details to Complies
  } catch (error) {
    console.error("Error in order processing:", error);
  }
}

main();
