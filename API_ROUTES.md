# API Routes Summary

## Authentication Endpoints
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/refresh` - Refresh authentication token
- **GET** `/api/auth/me` - Get current user info

## Products Endpoints
- **GET** `/api/products` - List all products (paginated, searchable)
- **POST** `/api/products` - Create a new product
- **GET** `/api/products/[id]` - Get product details
- **GET** `/api/products/[id]/alternatives` - Get alternative products

## Orders Endpoints
- **GET** `/api/orders` - List all orders
- **POST** `/api/orders` - Create a new order
- **GET** `/api/orders/[id]` - Get order details
- **GET** `/api/orders/[id]/items` - Get order items

## Customers Endpoints
- **GET** `/api/customers` - List all customers
- **POST** `/api/customers` - Create a new customer
- **GET** `/api/customers/[id]` - Get customer details
- **GET** `/api/customers/phone/[phone]` - Get customer by phone number

## Payments Endpoints
- **GET** `/api/payments` - List payments
- **POST** `/api/payments` - Record a payment

## Returns Endpoints
- **GET** `/api/returns` - List product returns
- **POST** `/api/returns` - Create a product return

## Inventory Endpoints
- **GET** `/api/inventory` - Get inventory status
- **POST** `/api/inventory/adjust` - Adjust inventory levels

## Reports Endpoints
- **GET** `/api/reports/sales` - Sales report
- **GET** `/api/reports/inventory` - Inventory report

## Dashboard Routes
- `/dashboard` - Main dashboard
- `/dashboard/orders` - Orders management
- `/dashboard/products` - Products listing
- `/dashboard/products/new` - Add new product
- `/dashboard/customers` - Customers management
- `/dashboard/payments` - Payments management
- `/dashboard/returns` - Returns management
- `/dashboard/reports` - Reports view

## Test Credentials
- **Email:** admin@pharmacy.com
- **Password:** admin123

Or use these additional test accounts:
- manager@pharmacy.com / manager123
- supervisor@pharmacy.com / supervisor123
- employee@pharmacy.com / employee123
