# LeadFusion HQ - Backend API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-5.x-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A powerful, scalable, and modular backend API for lead generation and management built with Node.js, Express.js, and MongoDB.

[Features](#-features) • [Installation](#-installation) • [Configuration](#-configuration) • [API Documentation](#-api-endpoints) • [Support](#-support)

</div>

---

## 🚀 Features

- **User Authentication & Authorization** - JWT-based secure authentication with role-based access control
- **Campaign Management** - Create, update, and manage lead generation campaigns
- **Lead Processing** - Comprehensive lead management with status tracking and payment processing
- **Real-time Notifications** - Socket.IO powered real-time notifications and chat
- **Billing & Payments** - Integrated billing system with transaction logging
- **SMS Integration** - Notifyre SMS service integration for notifications
- **Boberdoo Integration** - Lead distribution and management via Boberdoo API
- **Dashboard Analytics** - Comprehensive analytics and reporting endpoints
- **Redis Caching** - High-performance caching for improved response times
- **Job Queues** - Bull-powered background job processing
- **Docker Support** - Production-ready Docker configuration

---

## 📦 Installation

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x
- **Redis** >= 6.x (optional, for caching)
- **npm** or **yarn**

### Clone the Repository

```bash
git clone https://github.com/Leadfusionhq/leadfusionhq-backend.git
cd leadfusionhq-backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Copy the example environment file and update with your configuration:

```bash
cp .env.example .env
```

### Start the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

---

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=8080
ROUTE=api
NODE_URL=http://127.0.0.1
TZ=UTC

# Application URLs
UI_LINK=http://localhost:3000
BACKEND_LINK=http://localhost:8080

# MongoDB Configuration
MONGO_DB=leadfusion
MONGO_DB_HOST=127.0.0.1
MONGO_DB_PORT=27017
MONGO_POOL_SIZE=100

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
SMTP_MAIL=your-email@example.com
SMTP_PASS=your-email-password

# Notifyre SMS Service
NOTIFYRE_API_KEY=your-api-key
NOTIFYRE_BASE_URL=https://api.notifyre.com
NOTIFYRE_SENDER_ID=LEADFUSION
```

---

## 📁 Project Structure

```
leadfusionhq-backend/
├── app.js                  # Application entry point & Express setup
├── .env                    # Environment configuration
├── .env.example            # Example environment file
├── Dockerfile              # Production Docker configuration
├── Dockerfile.dev          # Development Docker configuration
├── docker-compose.yml      # Docker Compose configuration
├── package.json            # Dependencies and scripts
│
├── public/
│   └── uploads/            # File uploads directory
│
└── src/
    ├── config/             # Configuration files (MongoDB, Socket.IO, etc.)
    ├── controllers/        # Route controllers
    ├── helper/             # Helper functions
    ├── jobs/               # Background job definitions
    ├── mail/               # Email templates and services
    ├── middleware/         # Custom middleware (auth, validation, etc.)
    ├── models/             # Mongoose data models
    ├── queue/              # Job queue configurations
    ├── request-schemas/    # Request validation schemas
    ├── routes/             # API route definitions
    ├── services/           # Business logic layer
    ├── test/               # Test files
    └── utils/              # Utility functions and error handlers
```

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/forgot-password` | Password recovery |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | Get all campaigns |
| POST | `/api/campaigns` | Create new campaign |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### Leads
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | Get all leads |
| POST | `/api/leads` | Create new lead |
| PUT | `/api/leads/:id` | Update lead |
| GET | `/api/leads/user/:userId` | Get leads by user |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing` | Get billing history |
| POST | `/api/billing/charge` | Process payment |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/user-stats` | Get user statistics |
| GET | `/api/dashboard/admin-stats` | Get admin statistics |

### Additional Routes
- `/api/notifications` - Notification management
- `/api/chats` - Chat functionality
- `/api/locations` - Location/geocoding services
- `/api/faqs` - FAQ management
- `/api/feedback` - User feedback
- `/api/sms` - SMS services
- `/api/boberdo` - Boberdoo integration
- `/api/admin/boberdo` - Boberdoo admin management

---

## 🐳 Docker Deployment

### Build and Run with Docker Compose

```bash
docker-compose up -d
```

### Build Production Image

```bash
docker build -t leadfusionhq-backend .
docker run -p 8080:8080 leadfusionhq-backend
```

---

## 🧪 Development

### Running in Development Mode

```bash
npm run dev
```

This starts the server with `nodemon` for hot-reloading during development.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot-reload |
| `npm test` | Run tests |

---

## 🛡️ Security Best Practices

- All endpoints are protected with JWT authentication
- Helmet.js for security headers
- Request validation using Celebrate/Joi
- CORS configuration for cross-origin requests
- Environment-based configuration
- Redis caching with graceful fallback

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Support

For questions, issues, or feature requests, please reach out:

**Developer:** [@rahulsharma1902](https://github.com/rahulsharma1902)

- 🐛 [Report a Bug](https://github.com/Leadfusionhq/leadfusionhq-backend/issues/new?template=bug_report.md)
- 💡 [Request a Feature](https://github.com/Leadfusionhq/leadfusionhq-backend/issues/new?template=feature_request.md)
- 📧 [Contact Support](mailto:rahulsharma1902@gmail.com)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">

Made with ❤️ by [LeadFusion HQ](https://github.com/Leadfusionhq)

</div>
