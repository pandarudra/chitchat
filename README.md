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
│   │   │   │   ├── Media.ts
│   │   │   │   └── Gemini.ts
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
- **ESLint** and **Prettier** for code quality
- **Docker** for Redis containerization
- **Vercel** for frontend deployment
- **Environment-based configuration**
- **Git** with dev/main branch strategy

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local installation or MongoDB Atlas)
- Redis (Docker recommended)
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

## 📱 Usage Guide

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

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set build command: `cd apps/web && npm run build`
3. Set output directory: `apps/web/dist`
4. Configure environment variables in Vercel dashboard

### Backend (Your Choice)

- **Railway**: Easy deployment with automatic HTTPS
- **Heroku**: Classic PaaS with add-ons for MongoDB and Redis
- **DigitalOcean**: App Platform with managed databases
- **AWS**: EC2 with RDS and ElastiCache

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## � Contributors

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

**Built with ❤️ by [pandarudra](https://github.com/pandarudra)**

[![GitHub Stars](https://img.shields.io/github/stars/pandarudra/chitchat?style=social)](https://github.com/pandarudra/chitchat)
[![GitHub Forks](https://img.shields.io/github/forks/pandarudra/chitchat?style=social)](https://github.com/pandarudra/chitchat/fork)
[![GitHub Issues](https://img.shields.io/github/issues/pandarudra/chitchat)](https://github.com/pandarudra/chitchat/issues)
[![GitHub License](https://img.shields.io/github/license/pandarudra/chitchat)](https://github.com/pandarudra/chitchat/blob/main/LICENSE)
