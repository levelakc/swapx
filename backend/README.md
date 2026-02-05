# SwapX Backend

This is the backend for the SwapX peer-to-peer trading platform.

## Prerequisites

- Node.js
- MongoDB

## Installation

1.  Clone the repository.
2.  Navigate to the `backend` directory.
3.  Install the dependencies:
    ```
    npm install
    ```
4.  Create a `.env` file in the `backend` directory and add the following environment variables:
    ```
    MONGO_URI=<your_mongodb_uri>
    JWT_SECRET=<your_jwt_secret>
    JWT_EXPIRE=30d
    ```

## Usage

### Start the server

```
npm start
```

### Seed the database

To populate the database with sample data, run the following command:

```
npm run seed
```

### Destroy the data

To clear all data from the database, run the following command:

```
npm run destroy
```

## API Endpoints

The API endpoints are documented in the prompt.

## Project Structure

```
.
├── config
│   └── db.js
├── controllers
│   ├── adminController.js
│   ├── authController.js
│   ├── categoryController.js
│   ├── conversationController.js
│   ├── itemController.js
│   └── tradeController.js
├── middleware
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models
│   ├── Category.js
│   ├── Conversation.js
│   ├── Item.js
│   ├── Message.js
│   ├── Trade.js
│   └── User.js
├── routes
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   ├── conversationRoutes.js
│   ├── itemRoutes.js
│   └── tradeRoutes.js
├── seeders
│   └── seeder.js
├── utils
│   └── file-upload.js
├── .env
├── .gitignore
├── package.json
└── server.js
```
