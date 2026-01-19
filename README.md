# 🏥 Pharmacy Management System

A complete, production-ready pharmacy administration system built with modern web technologies.

## 🎯 Overview

This is a professional pharmacy management web application designed for administration and staff management. The system includes full order management, inventory tracking, customer management, payments, returns, and comprehensive reporting with AI-powered product recommendations.

## ✨ Features

### 📋 Core Functionality
- **User Management** - Role-based access control with 6 different user roles
- **Customer Management** - Complete customer database with order history
- **Product Inventory** - Full CRUD operations with stock tracking and low stock alerts
- **Order Management** - Complete order lifecycle from creation to delivery
- **Payment Processing** - Multiple payment methods with partial payment support
- **Returns Processing** - Product returns with automatic inventory updates
- **Inventory Logs** - Complete audit trail of all inventory movements

### 🤖 AI-Powered Features
- **Smart Product Alternatives** - AI analyzes product ingredients and usage to suggest alternatives
- **Intelligent Recommendations** - Dynamic alternatives based on active ingredients and categories
- **Professional Explanations** - AI provides pharmacist-level explanations for alternatives

### 📊 Reporting & Analytics
- **Sales Reports** - Revenue trends, top products, payment methods distribution
- **Inventory Reports** - Stock levels, low stock alerts, category distribution
- **Visual Analytics** - Beautiful charts and graphs powered by Recharts
- **Real-time Metrics** - Dashboard with key performance indicators

### 🔐 Security & Permissions
- **JWT Authentication** - Secure access and refresh tokens
- **Role-Based Access Control (RBAC)** - Granular permissions for each user role
- **API Security** - Protected endpoints with role validation

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Modern utility-first styling
- **shadcn/ui** - High-quality accessible components
- **Recharts** - Data visualization charts
- **Zustand** - Lightweight state management
- **Sonner** - Beautiful toast notifications

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Prisma ORM** - Type-safe database operations
- **SQLite** - Embedded database (production-ready)
- **JWT** - Token-based authentication
- **z-ai-web-dev-sdk** - AI capabilities integration

### Database Schema
- **Users & Employees** - User management with role hierarchy
- **Customers** - Customer database with order history
- **Products** - Product catalog with inventory tracking
- **Orders & Order Items** - Complete order management
- **Payments** - Payment processing and tracking
- **Returns** - Product returns management
- **Inventory Logs** - Audit trail for inventory

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access including system management |
| **Manager** | Full management (no system deletion) |
| **Supervisor** | Manage orders and inventory |
| **Employee** | Create orders, update order status, modify quantities |
| **Analyst** | View reports only |
| **Delegate** | Update assigned order statuses only |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Database credentials in `.env` file

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
bun run db:push

# Seed database with sample data
bun run db:seed

# Start development server
bun run dev
```

### Default Credentials

After running the seed script, you can login with:

```
Email: admin@pharmacy.com
Password: admin123
```

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                 # API endpoints
│   │   ├── auth/           # Authentication endpoints
│   │   ├── products/       # Product management
│   │   ├── customers/      # Customer management
│   │   ├── orders/         # Order management
│   │   ├── payments/       # Payment processing
│   │   ├── returns/        # Returns management
│   │   ├── inventory/      # Inventory management
│   │   └── reports/        # Analytics reports
│   ├── dashboard/          # Admin dashboard pages
│   │   ├── layout.tsx      # Dashboard layout
│   │   ├── page.tsx        # Dashboard home
│   │   ├── orders/         # Orders management
│   │   ├── products/       # Products management
│   │   ├── customers/      # Customers management
│   │   ├── payments/       # Payments view
│   │   └── reports/        # Reports & analytics
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (redirect)
├── components/              # React components
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
│   ├── auth.ts            # Authentication utilities
│   ├── rbac.ts            # Role-based access control
│   ├── api.ts             # API client
│   ├── api-response.ts    # API response helpers
│   └── db.ts              # Prisma client
├── store/                  # State management
│   └── auth.ts            # Auth state with Zustand
└── ...
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products (with search, filters)
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (soft delete)
- `GET /api/products/:id/alternatives` - Get AI-suggested alternatives

### Customers
- `GET /api/customers` - List customers (with search)
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/phone/:phone` - Get/create customer by phone

### Orders
- `GET /api/orders` - List orders (with filters)
- `POST /api/orders` - Create order (with stock checking)
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `POST /api/orders/:id/items` - Add item to order

### Payments
- `GET /api/payments` - List payments (with filters)
- `POST /api/payments` - Create payment

### Returns
- `GET /api/returns` - List returns (with filters)
- `POST /api/returns` - Create return

### Inventory
- `GET /api/inventory` - Get inventory logs
- `POST /api/inventory/adjust` - Adjust inventory quantity

### Reports
- `GET /api/reports/sales` - Sales analytics report
- `GET /api/reports/inventory` - Inventory report

## 🎨 UI Features

### Dashboard
- Real-time statistics overview
- Quick action cards
- Responsive design
- Mobile-friendly sidebar

### Pages
- **Products** - Full inventory management with search and low stock alerts
- **Orders** - Order list with status badges and payment tracking
- **Customers** - Customer database with order history
- **Reports** - Interactive charts and analytics
- **Payments & Returns** - Financial transaction management

### Design
- Clean, modern interface
- Consistent color scheme
- Accessible components (WCAG AA)
- Dark mode support
- Smooth animations

## 🔐 Security Features

- **Password Hashing** - Bcrypt for secure password storage
- **JWT Tokens** - Secure authentication with access and refresh tokens
- **Role Validation** - Every API endpoint validates user permissions
- **SQL Injection Protection** - Prisma ORM prevents SQL injection
- **XSS Protection** - Next.js built-in XSS protection

## 🤖 AI Integration

The system uses the z-ai-web-dev-sdk for:

1. **Product Alternatives** - When a product is out of stock, AI analyzes:
   - Active ingredients
   - Product category
   - Dosage form
   - Usage patterns

2. **Professional Recommendations** - AI provides:
   - Suitability scores
   - Detailed explanations
   - Key considerations
   - Ranked alternatives

3. **Fallback System** - If AI is unavailable, system shows basic alternatives by category

## 📊 Database Schema

Key tables and relationships:

- **users** - User accounts with roles
- **employees** - Employee hierarchy and departments
- **customers** - Customer information
- **products** - Product catalog with inventory
- **orders** - Order management
- **order_items** - Order line items
- **payments** - Payment records
- **returns** - Return records
- **inventory_logs** - Inventory audit trail

## 🧪 Testing

```bash
# Run linter
bun run lint

# Check types
bun run type-check
```

## 📦 Building for Production

```bash
# Create production build
bun run build

# Start production server
bun start
```

## 🔧 Configuration

### Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
NEXT_PUBLIC_API_URL=""
```

## 🚧 Future Enhancements

- [ ] WhatsApp integration (n8n → API)
- [ ] Real-time order updates via WebSocket
- [ ] Advanced analytics dashboard
- [ ] Invoice generation (PDF)
- [ ] Barcode scanning
- [ ] Multi-location support
- [ ] Email notifications
- [ ] SMS notifications

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Write clean, readable code
- Add comments for complex logic

### API Development
- Use proper HTTP status codes
- Return consistent JSON responses
- Include error messages
- Validate all inputs

### UI Development
- Use shadcn/ui components
- Follow design system
- Ensure accessibility
- Test responsive design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software.

## 🆘 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ for modern pharmacy management**
