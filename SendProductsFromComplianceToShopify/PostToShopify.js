const Shopify = require('shopify-api-node'); // Import Shopify API Node package for interacting with Shopify store
const axios = require('axios'); // Import Axios for making HTTP requests to external APIs
require('dotenv').config(); // Load environment variables from a .env file

// Shopify configuration using credentials from environment variables
const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORE_NAME, // Shopify store name
  apiKey: process.env.SHOPIFY_API_KEY, // Shopify API key
  password: process.env.SHOPIFY_PASSWORD, // Shopify API password
  apiVersion: '2023-10', // Shopify API version to ensure compatibility
});

// Fetch products data from Compliance API
async function fetchProducts() {
  try {
    const products = await axios.get('https://api.complies.nl/0/getproducts', {
      auth: {
        email: process.env.API_EMAIL, // Compliance API email from environment variables
        password: process.env.API_TOKEN, // Compliance API token from environment variables
      },
    });
    return products.data; // Return fetched product data
  } catch (err) {
    console.error(`Error in fetching products: ${err.message}`); // Log error if request fails
    return []; // Return an empty array as fallback if there's an error
  }
}

// Add a product to the Shopify store
async function addProductsToShopify(product) {
  // Prepare new product details in the format required by Shopify API
  const newProduct = {
    title: product.title, // Product title
    body_html: product.longdescription, // Detailed description
    vendor: product.brand, // Brand name as vendor
    tags: product.tags || '', // Product tags, default to empty if unavailable
    images: [
      {
        src: product.productimage, // Main product image URL
      },
    ],
    variants: [
      {
        price: product.totalprice.toFixed(2), // Selling price with two decimal points
        sku: product.itemcode, // Product SKU (stock-keeping unit)
        compare_at_price: product.suggestprice.toFixed(2), // Suggested retail price
        barcode: product.barcode || '', // Product barcode, empty if unavailable
        inventory_quantity: product.stockfree || 0, // Available stock quantity
        inventory_management: 'shopify', // Shopify manages inventory for this item
        inventory_policy: 'deny', // Deny purchase if out of stock
      },
    ],
    product_type: product.categoryname2, // Assign product type from category name
  };

  try {
    const response = await shopify.product.create(newProduct); // Send request to create product in Shopify
    console.log('Product added successfully:', response.title); // Confirm successful addition
  } catch (err) {
    console.error('Error in adding product:', err.response.body); // Log error details if addition fails
  }
}

// Check Shopify store connection and log store info
async function testShopifyConnection() {
  try {
    const shop = await shopify.shop.get(); // Fetch Shopify store information
    console.log('Shopify store info:', shop); // Log store information
  } catch (err) {
    console.error('Error connecting to Shopify:', err.response.body); // Log error if connection fails
  }
}

// Main function to sync products from Compliance to Shopify
async function main() {
  await testShopifyConnection(); // Test Shopify connection before starting sync
  const products = await fetchProducts(); // Fetch product list from Compliance API
  for (const product of products) {
    await addProductsToShopify(product); // Add each product to Shopify
  }
}

// Start automatic product sync on script run
main();
