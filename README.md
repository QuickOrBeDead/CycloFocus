![Screenshot](image.png)

# Cyclo Focus

A self-hosted minimalist productivity focus app for sustainable work. CycloFocus helps you maintain focus on one task at a time while managing your daily routines and todo lists with a clean, distraction-free interface.

<div align="center">
  <p>
    <img src="https://img.shields.io/github/stars/QuickOrBeDead/CycloFocus?style=flat-square" alt="GitHub Stars" />
    <img src="https://img.shields.io/github/license/QuickOrBeDead/CycloFocus?style=flat-square" alt="License" />
  </p>
</div>

---

## 🎯 Features

- **Dual Task Lists**: Separate daily routines and todo lists to organize your work
- **Focus Mode**: Highlights one current task to help you stay focused
- **Persistent Storage**: Your tasks are automatically saved to Redis storage
- **Self-Hosted**: Full control over your data with Docker deployment
- **Minimalist Design**: Clean, modern UI built with React and Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS 4** for styling
- **Lucide React** for icons
- **Nginx** for production serving

### Backend
- **Express.js** with TypeScript
- **Redis** for data persistence
- **Zod** for schema validation

### Infrastructure
- **Docker** & **Docker Compose** for containerization
- Multi-platform support (amd64/arm64)

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system
- (Optional) Node.js 18+ for local development

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/QuickOrBeDead/CycloFocus.git
cd CycloFocus
```

2. Start the application:
```bash
docker compose -f docker.compose.yml up -d
```

3. Access the application at [http://localhost:8080](http://localhost:8080)

The application will start three services:
- **Client**: React app served by Nginx on port 8080
- **API**: Express server (internal)
- **Redis**: Data storage (internal)

### Development Mode

For development with hot-reload:

```bash
docker compose -f docker.compose.debug.yml up
```

Or run services locally:

#### Backend
```bash
cd server
npm install
npm run dev
```

#### Frontend
```bash
cd client
npm install
npm run dev
```

## 📋 Usage

1. **Switch Between Lists**: Use the "Daily" and "Todo" tabs to switch between your daily routines and general tasks
2. **Add Tasks**: Click the "+" button and enter your task
3. **Focus on a Task**: Click the Play icon to set a task as your current focus
4. **Complete Tasks**: Check off completed tasks with the check icon
5. **Reset Daily Tasks**: Use the reset button to uncheck all daily tasks for a new day
6. **Manage Tasks**: Edit or delete tasks as needed

## 🏗️ Project Structure

```
CycloFocus/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   └── types/         # TypeScript types
│   ├── nginx/             # Nginx configuration
│   └── Dockerfile
├── server/                # Express backend
│   ├── src/
│   │   ├── middleware/    # Express middleware
│   │   └── schemas/       # Zod validation schemas
│   └── Dockerfile
└── docker.compose.yml     # Production compose file
```

## 🔧 Configuration

### Environment Variables

#### Client
- `VITE_API_URL`: API endpoint URL (default: `/api`)
- `BACKEND_URL`: Backend service URL for Nginx proxy

#### Server
- `PORT`: Server port (default: `3000`)
- `REDIS_URL`: Redis connection URL (default: `redis://redis:6379`)

## 🐳 Building for Production

### Multi-platform Docker Images

Use the provided script to build images for multiple architectures:

```bash
./build-push-docker-images-multiplatform.sh
```

This builds images for both amd64 and arm64 platforms.

## 📊 API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/list/:id` - Retrieve a task list (daily or todo)
- `POST /api/list/:id` - Save a task list

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Bora Akgün**

---

Built with focus and simplicity in mind. Stay productive! 🚀
