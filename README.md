# Node.js Backend Setup - Lawyer Directory

This project is a Node.js backend powered by Express.js and MongoDB, designed for scalable and modular API development.

---

## 📦 Installation

Clone the repository and install dependencies:

```bash
npm install
# OR
npm update


⚙️ Environment Variables
Create a .env file in the project root and add the following variables:
# App Settings
NODE_ENV='prod'
PORT=5000
ROUTE='api'
NODE_URL='http://127.0.0.1'
TZ='Asia/Karachi'

# SMTP Credentials (for email services)
SMTP_MAIL=''
SMTP_PASS=''

# Frontend & Backend URLs
UI_LINK='http://localhost:5000'
BACKEND_LINK='http://localhost:5000'

# MongoDB Settings
MONGO_DB='dropship-prod'
MONGO_DB_HOST='127.0.0.1'
MONGO_DB_PORT='27017'
MONGO_POOL_SIZE='100'

# JWT Secret (for authentication)
JWT_SECRET='8rFbtDg7/zy7jNWcAlEyck4ZvdXLfyxlJ5pJqyV2fVc='




├── app.js                  # Main express setup (routes, error handlers) & app entery point
├── .env                    # Environment configuration
├── src
│   ├── config              # MongoDB and other configs
│   ├── controllers         # Route controllers
│   ├── routes              # Express route definitions
│   ├── services            # Logic layer (DB queries, etc.)
│   └── utils               # Utility functions, error handlers
# leadfusionhq-backend
