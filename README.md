<div align="center">

# ChitChat 💬

### Modern Real-Time Communication Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)

</div>

---

**ChitChat** is a cutting-edge, full-stack real-time communication platform that brings people together through seamless messaging, crystal-clear video calls, and intelligent AI assistance. Built with modern web technologies including React, TypeScript, Express, MongoDB, and Redis, ChitChat delivers enterprise-grade performance with a consumer-friendly experience.

## ✨ What Makes ChitChat Special?

🚀 **Lightning Fast** - Real-time messaging with sub-second delivery  
🔐 **Secure by Design** - End-to-end encryption and JWT authentication  
📱 **Mobile First** - Responsive design that works everywhere  
🤖 **AI-Powered** - Intelligent responses with Google Gemini integration  
🎥 **HD Video Calls** - WebRTC-powered crystal clear communication  
☁️ **Cloud Ready** - Scalable architecture with Cloudinary integration

## 🚀 Features

### 💬 Core Chat Features

- **Real-time messaging** with Socket.io
- **Message types**: Text, Images, Videos, Audio recordings, Files
- **Message status**: Sent, Delivered, Read indicators
- **Voice messages** with waveform recording and playback
- **Media sharing** with Cloudinary integration (images & videos)
- **Emoji picker** with comprehensive emoji support
- **AI-powered responses** using Google Gemini
- **Typing indicators** in real-time
- **Message search** and filtering

### 📞 Communication Features

- **Video calls** with WebRTC (peer-to-peer)
- **Audio calls** with high-quality codecs
- **Call history** tracking and management
- **Call notifications** with browser notifications and ringtones
- **Draggable & resizable** picture-in-picture video during calls
- **Call controls**: Mute, camera toggle, speaker toggle, screen share
- **Call status tracking**: Connected, missed, declined, ended

### 🔐 Authentication & Security

- **OTP-based authentication** via SMS (production) / console (development)
- **JWT token management** with refresh tokens
- **Phone number verification**
- **Secure session handling**
- **Environment-based SMS configuration**

### 👥 Contact Management

- **Add contacts** by phone number
- **Contact info modal** with detailed user information
- **Block/unblock contacts** with privacy controls
- **Delete contacts** with confirmation dialogs
- **Online status indicators** (green dot for online users)
- **Last seen timestamps**
- **Contact search** and organization

### 🎨 User Interface

- **Responsive design** for mobile and desktop
- **Modern UI** with Tailwind CSS
- **Real-time typing indicators**
- **Chat list** with last message previews and timestamps
- **Search functionality** for chats and contacts
- **File upload** with drag-and-drop support
- **Settings panel** with profile customization
- **Animated video player** with custom controls
- **Audio waveform** visualization for voice messages

## 🏗️ Project Structure

```
chitchat/
├── apps/
│   ├── server/                 # Express backend
│   │   ├── src/
│   │   │   ├── controllers/    # API controllers
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── chat.controller.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── call.controller.ts
│   │   │   │   ├── media.controller.ts
│   │   │   │   └── otp.controller.ts
│   │   │   ├── models/         # MongoDB models
│   │   │   │   ├── User.ts
│   │   │   │   ├── Message.ts
│   │   │   │   ├── CallHistory.ts
│   │   │   │   └── Ai.ts
│   │   │   ├── routes/         # Express routes
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── ai.service.ts
│   │   │   │   ├── gemini.service.ts
│   │   │   │   └── socket.service.ts
│   │   │   ├── utils/          # Utilities
│   │   │   │   ├── multer.ts
│   │   │   │   ├── mongoDB.ts
│   │   │   │   ├── redisClient.ts
│   │   │   │   ├── jwt.ts
│   │   │   │   └── sms.ts
│   │   │   └── index.ts        # Server entry point
│   │   └── uploads/            # File storage
│   │       ├── audio/
│   │       ├── images/
│   │       └── videos/
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── components/     # React components
│       │   │   ├── auth/       # Authentication components
│       │   │   ├── chat/       # Chat-related components
│       │   │   ├── call/       # Video/Audio call components
│       │   │   ├── Layout/     # Layout components
│       │   │   └── ui/         # Reusable UI components
│       │   ├── context/        # React context providers
│       │   │   ├── AuthContext.tsx
│       │   │   └── ChatContext.tsx
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # API utilities
│       │   ├── types/          # TypeScript definitions
│       │   ├── utils/          # Helper functions
│       │   └── main.tsx        # App entry point
│       └── public/             # Static assets
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── eslint-config/          # Shared ESLint configuration
│   └── typescript-config/      # Shared TypeScript configuration
└── README.md
```

## 🛠️ Technologies

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling and hot reload
- **Tailwind CSS** for modern styling
- **Socket.io Client** for real-time communication
- **WebRTC** for peer-to-peer video/audio calls
- **Axios** for HTTP requests
- **React Router** for navigation
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend

- **Express.js** with TypeScript
- **MongoDB** with Mongoose ODM
- **Redis** for caching and session management
- **Socket.io** for real-time messaging
- **JWT** for authentication and authorization
- **Multer** for file upload handling
- **Cloudinary** for media storage and optimization
- **Twilio** for SMS (production environment)
- **Google Gemini AI** for intelligent responses

### DevOps & Tools

- **Turborepo** for monorepo management
- **Docker & Docker Compose** for containerized development and deployment
- **ESLint** and **Prettier** for code quality
- **MongoDB & Redis** containerization with persistent volumes
- **Vercel** for frontend deployment
- **Environment-based configuration** for development/production
- **Git** with dev/main branch strategy

## 🚀 Getting Started

### Prerequisites

**Option 1: Manual Setup**

- Node.js >= 18.0.0
- MongoDB (local installation or MongoDB Atlas)
- Redis (local installation or Docker)
- Cloudinary account (for media uploads)
- Twilio account (for SMS in production)
- Google AI Studio account (for Gemini AI)

**Option 2: Docker Setup (Recommended)**

- Docker and Docker Compose
- Cloudinary account (for media uploads)
- Twilio account (for SMS in production)
- Google AI Studio account (for Gemini AI)

### Quick Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/pandarudra/chitchat.git
   cd chitchat
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start Redis using Docker:**
   ```bash
   docker run --name local-redis -d -p 6379:6379 redis
   docker start local-redis
   ```

### Backend Configuration

1. **Navigate to server directory:**

   ```bash
   cd apps/server
   npm install
   ```

2. **Create `.env` file in `apps/server/`:**

   ```env
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/chitchat

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_USERNAME=
   REDIS_PASSWORD=

   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-here
   REFRESH_SECRET=your-super-secret-refresh-key-here

   # Cloudinary Media Storage
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret

   # Twilio SMS (Production)
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number

   # Google Gemini AI
   GEMINI_API_KEY=your-google-ai-studio-api-key

   # Server Configuration
   NODE_ENV=development
   PORT=8000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start the backend server:**
   ```bash
   npm run dev
   ```

### Frontend Configuration

1. **Navigate to web directory:**

   ```bash
   cd apps/web
   npm install
   ```

2. **Create `.env` file in `apps/web/`:**

   ```env
   VITE_BE_URL=http://localhost:8000
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

## � Docker Setup (Recommended)

For the easiest setup experience, use Docker to run the entire application stack with all dependencies.

### Prerequisites for Docker

- **Docker** and **Docker Compose** installed on your system
- **Git** for cloning the repository

### Quick Docker Start

1. **Clone and navigate to project:**

   ```bash
   git clone https://github.com/pandarudra/chitchat.git
   cd chitchat
   ```

2. **Create environment files:**

   **Backend `.env` file** (`apps/server/.env`):

   ```env
   # Database Configuration
   MONGO_URI=mongodb://mongodb:27017/chitchat

   # Redis Configuration
   REDIS_HOST=redis
   REDIS_PORT=6379
   REDIS_USERNAME=
   REDIS_PASSWORD=

   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-here
   REFRESH_SECRET=your-super-secret-refresh-key-here

   # Cloudinary Media Storage
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret

   # Twilio SMS (Production)
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number

   # Google Gemini AI
   GEMINI_API_KEY=your-google-ai-studio-api-key

   # Server Configuration
   NODE_ENV=development
   PORT=8000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start all services with Docker Compose:**

   ```bash
   docker-compose up -d
   ```

4. **View running containers:**

   ```bash
   docker-compose ps
   ```

5. **Access the application:**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **MongoDB**: localhost:27018
   - **Redis**: localhost:6380

### Docker Services Overview

| Service      | Container Name     | Port        | Description                      |
| ------------ | ------------------ | ----------- | -------------------------------- |
| **MongoDB**  | `chitchat-mongodb` | 27018:27017 | Database with persistent storage |
| **Redis**    | `chitchat-redis`   | 6380:6379   | Cache and session store          |
| **Backend**  | `chitchat-server`  | 8000:8000   | Express.js API server            |
| **Frontend** | `chitchat-web`     | 5173:5173   | React development server         |

### Docker Management Commands

**Start services:**

```bash
docker-compose up -d          # Run in background
docker-compose up             # Run with logs visible
```

**Stop services:**

```bash
docker-compose down           # Stop and remove containers
docker-compose stop           # Stop containers (keep them)
```

**View logs:**

```bash
docker-compose logs           # All services
docker-compose logs server    # Backend only
docker-compose logs web       # Frontend only
```

**Rebuild services:**

```bash
docker-compose up --build     # Rebuild and start
docker-compose build server   # Rebuild backend only
```

**Access container shell:**

```bash
docker exec -it chitchat-server sh    # Backend container
docker exec -it chitchat-mongodb sh   # MongoDB container
```

### Production Docker Setup

For production deployment, create a `docker-compose.prod.yml`:

```yaml
services:
  mongodb:
    image: mongo:7
    container_name: chitchat-mongodb-prod
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=chitchat
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=secure-password
    volumes:
      - mongodb_prod_data:/data/db
    restart: always
    networks:
      - chitchat-network

  redis:
    image: redis:7-alpine
    container_name: chitchat-redis-prod
    ports:
      - "6379:6379"
    command: redis-server --requirepass your-redis-password
    volumes:
      - redis_prod_data:/data
    restart: always
    networks:
      - chitchat-network

  server:
    build:
      context: ./apps/server
      target: production
    container_name: chitchat-server-prod
    ports:
      - "8000:8000"
    env_file:
      - ./apps/server/.env.production
    depends_on:
      - mongodb
      - redis
    restart: always
    networks:
      - chitchat-network

  web:
    build:
      context: ./apps/web
      target: production
    container_name: chitchat-web-prod
    ports:
      - "80:80"
    depends_on:
      - server
    restart: always
    networks:
      - chitchat-network

volumes:
  mongodb_prod_data:
  redis_prod_data:

networks:
  chitchat-network:
    driver: bridge
```

**Deploy to production:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Troubleshooting

**Common Issues:**

1. **Port conflicts:**

   ```bash
   # Check what's using the port
   netstat -an | findstr :5173

   # Kill process using port (Windows)
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. **Container won't start:**

   ```bash
   # Check container logs
   docker-compose logs service-name

   # Check container status
   docker ps -a
   ```

3. **Database connection issues:**

   ```bash
   # Test MongoDB connection
   docker exec -it chitchat-mongodb mongosh

   # Test Redis connection
   docker exec -it chitchat-redis redis-cli ping
   ```

4. **Clean reset:**
   ```bash
   # Remove all containers and volumes
   docker-compose down -v
   docker system prune -a
   ```

## �📱 Usage Guide

### Getting Started

1. **Registration**: Sign up with your phone number
2. **OTP Verification**: Receive and verify OTP (SMS in production, console in development)
3. **Profile Setup**: Set your display name and upload an avatar
4. **Start Chatting**: Begin conversations with contacts

### Messaging Features

- **Text Messages**: Send and receive real-time text messages
- **Voice Messages**: Record and send audio messages with one-tap recording
- **Media Sharing**: Upload and share images and videos (up to 50MB)
- **Emoji Support**: Use the built-in emoji picker for expressive messaging
- **AI Responses**: Get AI-powered responses using Google Gemini

### Video/Audio Calls

- **Initiate Calls**: Start video or audio calls from any chat
- **Call Management**: Accept, decline, or end calls with intuitive controls
- **Picture-in-Picture**: Resize and move the video window during calls
- **Call History**: View and manage your call history
- **Browser Notifications**: Receive call notifications even when the app isn't focused

### Contact Management

- **Add Contacts**: Search and add contacts by phone number
- **Contact Info**: View detailed contact information and status
- **Privacy Controls**: Block or unblock contacts as needed
- **Contact Organization**: Manage your contact list efficiently

## 🔌 API Documentation

### Authentication Endpoints

- `POST /api/auth/send-otp` — Send OTP to phone number
- `POST /api/auth/verify-otp` — Verify OTP code
- `POST /api/auth/signup` — Create new user account
- `POST /api/auth/login` — Login existing user
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Logout and invalidate session

### User Management

- `GET /api/user/profile` — Get current user profile
- `PUT /api/user/profile` — Update user profile information
- `GET /api/user/contacts` — Retrieve user's contact list
- `POST /api/user/add-contact` — Add new contact by phone number
- `POST /api/user/block-contact` — Block a specific contact
- `POST /api/user/unblock-contact` — Unblock a contact
- `DELETE /api/user/delete-contact/:contactId` — Delete contact

### Chat & Messaging

- `GET /api/chats/:userId/messages` — Get chat message history
- `POST /api/chats/send` — Send text message
- `POST /api/upload/audio` — Upload and send audio message
- `POST /api/upload/image` — Upload and send image
- `POST /api/upload/video` — Upload and send video

### Call Management

- `GET /api/calls/history` — Retrieve call history
- `POST /api/calls/start` — Initiate a new call
- `PUT /api/calls/:callId/end` — End an active call
- `DELETE /api/calls/:callId` — Delete specific call from history
- `DELETE /api/calls/clear` — Clear entire call history

### OTP Management

- `POST /api/otp/send` — Send OTP (environment-aware)
- `POST /api/otp/verify` — Verify OTP code

## 🧪 Development

### Available Scripts

**Root Level (Turborepo):**

```bash
npm run dev          # Start all applications in development mode
npm run build        # Build all applications for production
npm run lint         # Run ESLint across all applications
npm run clean        # Clean all build artifacts and node_modules
```

**Backend Development:**

```bash
cd apps/server
npm run dev          # Start backend with hot reload
npm run build        # Build backend for production
npm run start        # Start production backend
npm run lint         # Lint backend code
```

**Frontend Development:**

```bash
cd apps/web
npm run dev          # Start frontend with hot reload
npm run build        # Build frontend for production
npm run preview      # Preview production build
npm run lint         # Lint frontend code
```

### Git Workflow

**Development Branch:**

```bash
git checkout -b dev                    # Create and switch to dev branch
git add .                             # Stage all changes
git commit -m "feat: your feature"    # Commit with conventional message
git push -u origin dev                # Push to dev branch
```

**Production Deployment:**

```bash
git checkout main                     # Switch to main branch
git merge dev                         # Merge dev into main
git push origin main                  # Deploy to production
```

### Environment Setup

**Development Environment:**

- SMS: Console logging (no actual SMS sent)
- Database: Local MongoDB
- Redis: Docker container
- File uploads: Local storage + Cloudinary

**Production Environment:**

- SMS: Twilio integration
- Database: MongoDB Atlas (recommended)
- Redis: Managed Redis service
- File uploads: Cloudinary CDN

## 🌟 Key Features Deep Dive

### Real-time Communication

- **Socket.io Integration**: Bidirectional event-based communication
- **Message Status Tracking**: Real-time delivery and read receipts
- **Typing Indicators**: Live typing status updates
- **Online Presence**: Real-time user status monitoring

### Media Handling

- **Multi-format Support**: Images (JPEG, PNG, GIF), Videos (MP4, WebM), Audio (WebM, MP3)
- **File Size Limits**: Up to 50MB for media files
- **Cloud Storage**: Secure Cloudinary integration
- **Compression**: Automatic media optimization

### AI Integration

- **Google Gemini**: Advanced AI-powered responses
- **Context Awareness**: Maintains conversation context
- **Natural Language**: Human-like interaction patterns

### WebRTC Implementation

- **Peer-to-peer Connections**: Direct browser-to-browser communication
- **STUN/TURN Servers**: NAT traversal and connectivity
- **Media Streams**: High-quality audio and video transmission
- **Adaptive Quality**: Automatic quality adjustment based on connection

## � Performance & Optimization

### Frontend Performance

- **Code Splitting**: Dynamic imports for optimal bundle sizes
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Cloudinary automatic format optimization
- **Caching Strategy**: Redis-powered backend caching
- **WebSocket Efficiency**: Optimized real-time communication

### Backend Performance

- **Database Indexing**: Optimized MongoDB queries
- **Redis Caching**: Fast session and data retrieval
- **Connection Pooling**: Efficient database connections
- **File Upload Streaming**: Large file handling without memory issues
- **Rate Limiting**: API protection against abuse

## 🔒 Security Features

### Data Protection

- **JWT Authentication**: Secure token-based authentication
- **Password-less Auth**: OTP-based verification system
- **Data Encryption**: Sensitive data encryption at rest
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request security

### Privacy Controls

- **Contact Blocking**: User-controlled contact management
- **Media Privacy**: Secure file upload and access
- **Session Management**: Automatic token refresh and logout
- **Environment Isolation**: Development/production separation

## 🐛 Troubleshooting

### Common Issues

**1. Redis Connection Error**

```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis if stopped
docker start local-redis

# Or run a new Redis container
docker run --name local-redis -d -p 6379:6379 redis
```

**2. MongoDB Connection Issues**

```bash
# Check MongoDB status (if running locally)
mongosh --eval "db.adminCommand('ismaster')"

# For MongoDB Atlas, verify connection string in .env
```

**3. OTP Not Received**

- **Development**: Check console logs for OTP
- **Production**: Verify Twilio credentials and phone number format

**4. File Upload Errors**

- Check Cloudinary credentials in `.env`
- Verify file size limits (max 50MB)
- Ensure proper file formats (images: JPG, PNG, GIF; videos: MP4, WebM)

**5. Video Call Issues**

- Allow camera/microphone permissions in browser
- Check for browser compatibility (WebRTC support)
- Verify STUN/TURN server configuration

### Debug Mode

Enable detailed logging:

**Backend (.env):**

```env
NODE_ENV=development
DEBUG=socket.io*,express:*
```

**Frontend (browser console):**

```javascript
localStorage.setItem("debug", "socket.io-client:*");
```

## �🚀 Deployment

### Frontend (Vercel - Recommended)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Build Settings**:
   - Build Command: `cd apps/web && npm run build`
   - Output Directory: `apps/web/dist`
   - Install Command: `npm install`
3. **Environment Variables**:
   ```env
   VITE_BE_URL=https://your-backend-url.com
   ```
4. **Deploy**: Automatic deployment on push to main branch

### Backend Deployment Options

**Option 1: Railway (Recommended)**

1. Connect GitHub repository
2. Select `apps/server` as root directory
3. Add environment variables
4. Deploy with automatic HTTPS

**Option 2: Render**

1. Create new Web Service
2. Connect repository
3. Set build command: `cd apps/server && npm install && npm run build`
4. Set start command: `cd apps/server && npm start`

**Option 3: DigitalOcean App Platform**

1. Create new app from GitHub
2. Configure build and run commands
3. Add managed database and Redis

### Production Environment Variables

**Backend (.env.production):**

```env
# Database (MongoDB Atlas recommended)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chitchat

# Redis (Upstash or Redis Labs)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT Secrets (generate strong secrets)
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars

# Cloudinary (required for media)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Twilio (required for SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Production settings
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-frontend-domain.com
```

### Database Setup (MongoDB Atlas)

1. **Create Cluster**: Sign up at MongoDB Atlas
2. **Create Database**: Name it `chitchat`
3. **Network Access**: Add your server IP or 0.0.0.0/0 for development
4. **Database User**: Create user with read/write permissions
5. **Connection String**: Copy and update MONGO_URI in .env

### Redis Setup (Upstash)

1. **Create Database**: Sign up at Upstash
2. **Copy Credentials**: Get host, port, and password
3. **Update Environment**: Add Redis credentials to .env

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Here's how you can help make ChitChat better:

### Ways to Contribute

- 🐛 **Bug Reports**: Found a bug? Open an issue with detailed reproduction steps
- ✨ **Feature Requests**: Have an idea? We'd love to hear it!
- 📝 **Documentation**: Help improve our docs, add examples, or fix typos
- 💻 **Code Contributions**: Submit bug fixes, features, or improvements
- 🎨 **Design**: UI/UX improvements and accessibility enhancements
- 🧪 **Testing**: Add tests, improve coverage, or test new features

### Development Process

1. **Fork & Clone**:

   ```bash
   git clone https://github.com/your-username/chitchat.git
   cd chitchat
   ```

2. **Create Feature Branch**:

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Install Dependencies**:

   ```bash
   npm install
   ```

4. **Make Changes**: Follow our coding standards and test your changes

5. **Commit with Convention**:

   ```bash
   git commit -m "feat: add amazing feature"
   ```

   **Commit Types:**

   - `feat:` New features
   - `fix:` Bug fixes
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Test additions/changes
   - `chore:` Maintenance tasks

6. **Push & Create PR**:
   ```bash
   git push origin feature/amazing-feature
   ```

### Code Standards

- **TypeScript**: Write type-safe code with proper interfaces
- **ESLint**: Follow the configured linting rules
- **Prettier**: Code is automatically formatted
- **Testing**: Add tests for new features when possible
- **Documentation**: Update README and add inline comments

### Good First Issues

New to the project? Look for issues labeled [`good first issue`](https://github.com/pandarudra/chitchat/labels/good%20first%20issue):

- Documentation improvements
- UI/UX enhancements
- Bug fixes
- Feature implementations
- Test coverage improvements

## 🚀 Roadmap

### Version 2.0 (Coming Soon)

- [ ] **Group Chats**: Multi-user conversations with admin controls
- [ ] **Message Reactions**: Emoji reactions to messages
- [ ] **File Sharing**: Send documents, PDFs, and other file types
- [ ] **Voice Calls**: Audio-only calling with improved quality
- [ ] **Screen Sharing**: Share your screen during video calls
- [ ] **Message Threads**: Reply to specific messages
- [ ] **Dark Mode**: Full dark theme support
- [ ] **Push Notifications**: Native mobile notifications
- [ ] **Message Encryption**: End-to-end encryption for messages

### Version 2.1 (Future)

- [ ] **Mobile App**: React Native mobile application
- [ ] **Desktop App**: Electron desktop application
- [ ] **Message Scheduling**: Send messages at specific times
- [ ] **Auto-translate**: Real-time message translation
- [ ] **Advanced AI**: More sophisticated AI responses and features
- [ ] **Video Filters**: Fun filters and effects for video calls
- [ ] **Chatbots**: Integrate custom chatbots
- [ ] **API for Developers**: Public API for third-party integrations

### Long-term Vision

- [ ] **Enterprise Features**: Team management, admin panels
- [ ] **Workspace Integration**: Slack/Discord-like features
- [ ] **Advanced Analytics**: Usage statistics and insights
- [ ] **Custom Themes**: User-customizable UI themes
- [ ] **Plugin System**: Extensible architecture for community plugins

## 📊 Project Stats

![GitHub repo size](https://img.shields.io/github/repo-size/pandarudra/chitchat)
![GitHub code size](https://img.shields.io/github/languages/code-size/pandarudra/chitchat)
![GitHub top language](https://img.shields.io/github/languages/top/pandarudra/chitchat)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/pandarudra/chitchat)
![GitHub last commit](https://img.shields.io/github/last-commit/pandarudra/chitchat)

## 👨‍💻 Contributors

We thank the following people for their contributions to ChitChat:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<a href="https://github.com/pandarudra/chitchat/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=pandarudra/chitchat" />
</a>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

### How to Add Yourself

If you've contributed to this project, feel free to add yourself to the contributors list:

1. **Fork the repository**
2. **Add your entry** to the contributors table above
3. **Include appropriate contribution types** using the [emoji key](https://allcontributors.org/docs/en/emoji-key):
   - 💻 Code
   - 🎨 Design
   - 📖 Documentation
   - 🐛 Bug reports
   - 💡 Ideas & Planning
   - 🤔 Mentoring
   - 📋 Project Management
   - 👀 Reviewed Pull Requests
   - 🚇 Infrastructure
   - ⚠️ Tests
   - 🚧 Maintenance
4. **Submit a pull request**

Want to contribute but don't know where to start? Check out our [good first issues](https://github.com/pandarudra/chitchat/labels/good%20first%20issue) or reach out to the maintainers!

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Socket.io** for real-time communication
- **WebRTC** for peer-to-peer video calls
- **Cloudinary** for media management
- **MongoDB** for flexible data storage
- **Redis** for fast caching and sessions
- **Tailwind CSS** for beautiful UI design
- **Turborepo** for efficient monorepo management

---

<div align="center">

**🌟 Star this project if you found it helpful! 🌟**

**Built with ❤️ by [pandarudra](https://github.com/pandarudra)**

[![GitHub Stars](https://img.shields.io/github/stars/pandarudra/chitchat?style=social)](https://github.com/pandarudra/chitchat)
[![GitHub Forks](https://img.shields.io/github/forks/pandarudra/chitchat?style=social)](https://github.com/pandarudra/chitchat/fork)
[![GitHub Issues](https://img.shields.io/github/issues/pandarudra/chitchat)](https://github.com/pandarudra/chitchat/issues)
[![GitHub License](https://img.shields.io/github/license/pandarudra/chitchat)](https://github.com/pandarudra/chitchat/blob/main/LICENSE)

### 📬 Connect with the Author

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/pandarudra)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/pandarudra)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/pandarudra)

_Made with TypeScript, React, and lots of coffee ☕_

</div>
