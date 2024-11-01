const axios = require("axios");
const Shopify = require("shopify-api-node");
require("dotenv").config();

const shopify = new Shopify({
    shopName: process.env.SHOPIFY_SHOP_NAME,
    apiKey: process.env.SHOPIFY_API_KEY,
    password: process.env.SHOPIFY_PASSWORD,
});

// Helper function to format date in ISO 8601
function formatDate(date) {
    return new Date(date).toISOString();
}

// Mock orders for testing
const mockOrders = {
    ordernr: "34851564",
    orderref: "Webshop#1234",
    description: "Test Product 1",
    approved: 1,
    done: 0,
    status: "APPROVED",
    price: 10.0,
    totalprice: 15.0,
    vat: 5.0,
    delivered: 0,
    quantity: 1,
    created: "2023-01-01T11:49:44+02:00",
    date: "2023-01-01T00:00:00+02:00",
    shipmentdate: "2023-01-02T00:00:00+02:00",
    selcode: "DS",
    seldescription: "Dropshipment",
    orderedbyname: "John Doe",
    orderedbyaddress: "123 Test Street",
    orderedbycity: "Test City",
    orderedbyzipcode: "12345",
    orderedbycountry: "NL",
    orderedbyemail: "john@example.com",
    orderedbyphone: "123456789",
    customername: "Jane Doe",
    customeraddress: "123678 Test Street",
    customercity: "Test City",
    customerzipcode: "12345",
    customercountry: "NL",
    customeremail: "jane@example.com",
    customerphone: "123456789",
};

// Fetch orders from Complies or use mock data
async function fetchOrders(dateFrom, dateTo) {
    try {
        const url = `https://api.complies.nl/0/getorders?datefrom=${encodeURIComponent(dateFrom)}&dateto=${encodeURIComponent(dateTo)}`;
        console.log(url)
        const response = await axios.get(url, {
            auth: {
                username: process.env.API_EMAIL,
                password: process.env.API_PASSWORD,
            },
        });

        if (response.data.length === 0) {
            console.log("No real orders found, using mock data for testing.");
            return [mockOrders]; // Return as an array for consistency
        }

        console.log("Orders fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders", error.message);
        return [mockOrders]; // Use mock data if there’s an error
    }
}

// Test Shopify connection
async function testShopifyConnection() {
    try {
        const shop = await shopify.shop.get();
        console.log("Shopify store info:", shop);
    } catch (err) {
        console.error("Error connecting to Shopify:", err.response ? err.response.body : err.message);
    }
}

// Create an order in Shopify with improved error handling
async function createShopifyOrder(order) {
    try {
        const response = await shopify.order.create({
            line_items: [
                {
                    variant_id: 49578714759507, // Replace with your actual variant ID
                    quantity: order.quantity,
                }
            ],
            customer: {
                id: 987654321 // Ensure this is a valid customer ID
            },
            billing_address: {
                first_name: order.orderedbyname.split(" ")[0],
                last_name: order.orderedbyname.split(" ").slice(1).join(" "),
                address1: order.orderedbyaddress,
                city: order.orderedbycity,
                province: "punjab", // Set to null if not applicable
                country: order.orderedbycountry,
                zip: order.orderedbyzipcode,
                phone: order.orderedbyphone, // Optional
            },
            shipping_address: {
                first_name: order.customername.split(" ")[0],
                last_name: order.customername.split(" ").slice(1).join(" "),
                address1: order.customeraddress,
                city: order.customercity,
                province: "sindh", // Set to null if not applicable
                country: order.customercountry,
                zip: order.customerzipcode,
                phone: order.customerphone, // Optional
            },
            financial_status: 'paid', // Adjust based on order status
        });
        console.log(`Shopify order created: ${JSON.stringify(response)}`);
    } catch (error) {
        console.error("Error creating Shopify order (full error):", error);
        console.error("Error message:", error.message);
    }
}

// Main function to process orders
async function main() {
    const now = new Date();
    const realTimeDate = formatDate(now);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDayFormatted = formatDate(startOfDay);
    
    await testShopifyConnection(); // Await the connection test
    
    const orders = await fetchOrders(startOfDayFormatted, realTimeDate);
    console.log(`Mock return: ${JSON.stringify(orders)}`);

    // Throttling requests to avoid hitting Shopify API limits
    for (const order of orders) {
        await createShopifyOrder(order);
    }
}

main();
