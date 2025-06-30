# BharatGodam - Warehouse Management System

A comprehensive digital platform for agricultural commodity storage and warehouse management, built with Node.js, Express, and MongoDB.

## 🚀 Project Overview

BharatGodam is a full-stack warehouse management system designed to streamline the storage, management, and logistics of agricultural commodities. The platform connects farmers, traders, warehouse owners, and financial institutions through a unified digital ecosystem.

### Key Features
- **Multi-role User Management** (Farmers, Traders, Warehouse Owners, Managers, Admins)
- **Warehouse Booking & Capacity Management**
- **Commodity Grading & Quality Assessment**
- **Weighbridge Integration**
- **Shipping & Logistics Management**
- **Invoice & Billing System**
- **Loan Management & Pledge System**
- **Real-time Notifications**
- **KYC Verification System**

## 👨‍💻 My Role

**Backend Developer** - Worked on most of the core features and functionalities:

### Features I Built
- **User Authentication & Authorization System**
  - Phone-based OTP verification
  - JWT token management
  - Role-based access control
  - KYC verification workflow

- **Warehouse Management Module**
  - Warehouse registration and CRUD operations
  - Capacity management (total, filled, remaining)
  - Commodity pricing system
  - Manager assignment functionality
  - Rating and review system
  - Wishlist feature

- **Booking System**
  - Date-based warehouse booking
  - Automatic pricing calculation
  - Capacity validation
  - Booking status management
  - Expired booking automation

- **Deposit & Storage Management**
  - Slot assignment system
  - Revalidation date tracking
  - Commodity type management
  - Weight tracking

- **Weighbridge Integration**
  - Gross, tare, and net weight measurement
  - Truck and driver information
  - Unit conversion support

- **Shipping & Logistics**
  - Shipping assignment and tracking
  - OTP-based verification
  - Status updates
  - Image documentation

- **Grading System**
  - Quality assessment algorithms
  - Multiple grading parameters
  - Grade assignment logic

- **Invoice & Billing System**
  - Automatic invoice generation
  - Multiple charge components
  - Payment tracking
  - Financial reporting

- **Loan Management**
  - Pledge-based loan applications
  - Loan status workflow
  - Interest calculation
  - Disbursement tracking

- **Notification System**
  - Real-time notifications
  - Email integration
  - SMS notifications via AWS SNS

## 🛠️ Technologies Used

### Backend Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **Joi** - Data validation
- **Express-validator** - Request validation

### Cloud Services & Integrations
- **AWS S3** - File storage and management
- **AWS SNS** - SMS notifications
- **AWS CloudWatch** - Logging and monitoring
- **Gmail SMTP** - Email notifications

### Development Tools
- **Winston** - Logging framework
- **Multer** - File upload handling
- **Multer-S3** - S3 file upload integration
- **Node-cron** - Task scheduling
- **Day.js** - Date manipulation
- **Lodash** - Utility functions
- **Chalk** - Console coloring

### DevOps & Deployment
- **Git** - Version control
- **GitHub** - Repository hosting
- **Environment Variables** - Configuration management
- **CORS** - Cross-origin resource sharing

## 🏗️ System Architecture

### Database Schema
```
Users
├── Personal Information (name, phone, email)
├── Role-based Access (Farmer, Trader, Warehouse Owner, etc.)
├── KYC Details (Aadhar, PAN verification)
└── Warehouse Associations

Warehouses
├── Basic Information (name, location, capacity)
├── Commodity Pricing
├── Manager Assignments
├── Ratings & Reviews
└── Bank Account Details

Bookings
├── User & Warehouse References
├── Date & Time Information
├── Capacity & Pricing Details
├── Status Management
└── Related Documents (Deposits, Shipping, etc.)

Deposits
├── Commodity Information
├── Quality Grading
├── Slot Assignment
└── Revalidation Tracking

Weighbridge
├── Weight Measurements
├── Truck Information
└── Driver Details

Shipping
├── Logistics Information
├── OTP Verification
└── Status Tracking

Invoices
├── Multiple Charge Components
├── Payment Tracking
└── Financial Calculations

Loans
├── Application Details
├── Status Workflow
└── Financial Terms
```

### API Structure
```
/api
├── /auth - Authentication endpoints
├── /warehouse - Warehouse management
├── /booking - Booking operations
├── /deposit - Deposit management
├── /weighbridge - Weight measurement
├── /shipping - Logistics management
├── /invoice - Billing system
├── /loan - Loan management
├── /notification - Notifications
├── /commodity - Commodity management
├── /grade - Quality grading
├── /admin - Administrative functions
└── /upload - File upload handling
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- AWS Account (for S3, SNS, CloudWatch)
- Gmail Account (for SMTP)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bharatgodam-warehouse-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database
   MONGO_URL=mongodb://localhost:27017/bharatgodam
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   
   # AWS Configuration
   AWS_ACCESSKEY=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=your_aws_region
   AWS_CLOUD_WATCH_ACCESS_KEY=your_cloudwatch_key
   AWS_CLOUD_WATCH_SECRET_KEY=your_cloudwatch_secret
   AWS_CLOUD_WATCH_REGION=your_cloudwatch_region
   AWS_CLOUD_LOG_GROUP=your_log_group
   
   # Email Configuration
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_PASS=your_gmail_app_password
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Database Setup
The application will automatically create the necessary collections when it starts. Ensure MongoDB is running and accessible.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup-phone` - Phone-based signup
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/create-account` - Account creation
- `POST /api/auth/login` - User login

### Warehouse Endpoints
- `POST /api/warehouse` - Create warehouse
- `GET /api/warehouse` - Get all warehouses
- `GET /api/warehouse/:id` - Get warehouse by ID
- `PUT /api/warehouse/:id` - Update warehouse
- `DELETE /api/warehouse/:id` - Delete warehouse
- `PUT /api/warehouse/commodity/:id` - Add commodity

### Booking Endpoints
- `POST /api/booking/:warehouseId` - Create booking
- `GET /api/booking` - Get user bookings
- `PUT /api/booking/:id/accept` - Accept booking
- `PUT /api/booking/:id/reject` - Reject booking

### Deposit Endpoints
- `POST /api/deposit` - Create deposit
- `GET /api/deposit` - Get deposits
- `PUT /api/deposit/:id` - Update deposit

### Weighbridge Endpoints
- `POST /api/weighbridge` - Create weighbridge entry
- `GET /api/weighbridge` - Get weighbridge entries

### Shipping Endpoints
- `POST /api/shipping` - Create shipping
- `GET /api/shipping` - Get shipping details
- `PUT /api/shipping/:id` - Update shipping status

### Invoice Endpoints
- `POST /api/invoice` - Generate invoice
- `GET /api/invoice` - Get invoices
- `PUT /api/invoice/:id` - Update invoice

### Loan Endpoints
- `POST /api/loan` - Apply for loan
- `GET /api/loan` - Get loan applications
- `PUT /api/loan/:id` - Update loan status

## 🔐 Authentication & Authorization

### User Roles
- **Farmer** - Can book warehouses and manage deposits
- **Trader** - Can trade commodities and manage bookings
- **FPO** - Farmer Producer Organization access
- **Warehouse Owner** - Can manage warehouses and bookings
- **Manager** - Can manage assigned warehouses
- **Admin** - Full system access
- **Pledge** - Loan-related operations

### JWT Token Structure
```json
{
  "data": {
    "phone": "user_phone",
    "role": "user_role",
    "_id": "user_id",
    "firstName": "user_first_name",
    "lastName": "user_last_name"
  },
  "iat": "issued_at",
  "exp": "expires_at"
}
```

## 🔄 Team Workflow

**Worked on a team-based repository with Git branching & PR system**

### Development Process
1. **Feature Branches** - Created feature-specific branches for development
2. **Pull Requests** - Code review through PR system
3. **Code Review** - Team collaboration on code quality
4. **Testing** - Comprehensive testing before merge
5. **Deployment** - Staged deployment process

### Git Workflow
```bash
# Feature development
git checkout -b feature/warehouse-management
# Development work
git add .
git commit -m "Add warehouse management features"
git push origin feature/warehouse-management
# Create Pull Request for review
```

### Code Quality Standards
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **JSDoc** - Documentation standards
- **Error Handling** - Comprehensive error management
- **Logging** - Structured logging with Winston

## 📊 Key Features Implemented

### 1. Multi-Role User System
- Role-based authentication and authorization
- KYC verification workflow
- Profile management with document upload

### 2. Warehouse Management
- Dynamic capacity management
- Commodity pricing system
- Manager assignment and permissions
- Rating and review system

### 3. Booking & Storage
- Date-based booking system
- Automatic pricing calculation
- Capacity validation
- Status tracking workflow

### 4. Quality Control
- Weighbridge integration
- Commodity grading system
- Quality assessment algorithms

### 5. Financial Management
- Invoice generation
- Payment tracking
- Loan management system
- Financial reporting

### 6. Logistics & Shipping
- Shipping assignment
- OTP verification
- Status tracking
- Document management

## 🔧 Configuration & Deployment

### Environment Variables
All sensitive configuration is managed through environment variables for security and flexibility.

### AWS Services Integration
- **S3** - Document and image storage
- **SNS** - SMS notifications
- **CloudWatch** - Application monitoring and logging

### Email Integration
- Gmail SMTP for automated email notifications
- Template-based email system
- OTP and status update emails

## 📈 Performance & Monitoring

### Logging
- Winston logger with CloudWatch integration
- Structured logging for better debugging
- Error tracking and monitoring

### Automated Tasks
- Cron jobs for booking expiration
- Automated notifications
- System maintenance tasks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software developed for BharatGodam.

---

**Built with ❤️ for BharatGodam** 
