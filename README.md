
# Shopify App API

This project is a Node.js and Express application designed to integrate Shopify with an external API (Complies). It enables automated product synchronization from the Complies API to Shopify and handles order data synchronization between the two systems.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Deployment on Vercel](#deployment-on-vercel)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
---

## Features
- Fetches product data from the Complies API and adds it to the Shopify store.
- Listens for order events from Shopify and forwards them to the Complies API.
- Includes retry logic for handling API calls with transient errors.
- Automatically updates Shopify order notes with fulfillment status from the Complies API.

## Prerequisites
- **Node.js** (>=16.x)
- **Shopify Store** with API credentials
- **Complies API** credentials

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/shopify-app-api.git
   cd shopify-app-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root to configure environment variables.

## Environment Variables
The application uses environment variables for configuration. 
Make sure to keep the `.env` file secure and do not share it publicly, as it contains sensitive API keys and credentials.

## Usage
### 1. Start the Application
To start the application, run:
```bash
node index.js
```

### 2. Product Synchronization
- The application automatically fetches products from the Complies API and adds them to your Shopify store.

### 3. Order Fulfillment
- Order data received from Shopify will be mapped and forwarded to the Complies API.
- The app updates the Shopify order note with the delivery status from the Complies API.

### 4. Webhook Setup
To set up automatic fulfillment, configure a Shopify webhook pointing to `/webhooks/order/fulfillment`, which is routed to the internal endpoint `/api/order-fulfillment`. This allows Shopify to send order data to your app for processing.

## Deployment on Vercel
This app can be deployed on [Vercel](https://vercel.com/), which provides hosting and serverless functions for Node.js applications.

1. **Deployment**: Push the code to a Git repository (e.g., GitHub), then import the repository on Vercel to deploy it.

2. **Environment Variables**: In Vercel, go to **Settings > Environment Variables** and add the variables from your `.env` file (e.g., `SHOPIFY_API_KEY`, `SHOPIFY_SHOP_NAME`, `SHOPIFY_PASSWORD`, `API_TOKEN`, `API_EMAIL`).

3. **Rewrites Configuration**: To redirect webhook requests, add the following configuration to `vercel.json`:

    ```json
    {
      "rewrites": [
        {
          "source": "/webhooks/order/fulfillment",
          "destination": "/api/order-fulfillment"
        }
      ]
    }
    ```

   - **source**: `/webhooks/order/fulfillment` - The public endpoint where Shopify sends order fulfillment events.
   - **destination**: `/api/order-fulfillment` - The internal path where the app processes these webhook events for order fulfillment updates.

This setup allows incoming Shopify webhook requests to be redirected to the appropriate internal API without exposing the internal path.

## Scripts
- **Test:** Placeholder for tests. Customize this if additional test scripts are added to the project.

## Dependencies
The following dependencies are used in this project:

- **axios**: For making HTTP requests to the Complies API.
- **body-parser**: Middleware for parsing request bodies in Express.
- **dotenv**: For loading environment variables from the `.env` file.
- **express**: Web framework for Node.js.
- **shopify-api-node**: SDK to interact with the Shopify API.

