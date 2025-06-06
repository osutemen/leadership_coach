# Leadership Coach 🚀

An AI-powered leadership coaching platform for modern leadership and professional development. Built with OpenAI's GPT-4.1 model, featuring file search and web search capabilities for intelligent leadership guidance.

## 🌟 Features

### 🎯 Core Features
- **Expert Leadership Guidance**: In-depth guidance from curated leadership resources
- **File Search**: Intelligent search and analysis through uploaded documents
- **Web Search**: Automatic internet research for current information
- **Real-time Responses**: Streaming chat experience
- **Professional Tone**: Sharp and effective communication suitable for business world
- **Conversation History**: Chat memory for context preservation

### 🛠️ Technical Features
- **Modern Stack**: Next.js 13 + FastAPI + TypeScript
- **AI Integration**: OpenAI GPT-4.1 Responses API
- **Streaming**: Real-time response streaming
- **Docker Support**: Full containerization
- **Responsive UI**: Modern and user-friendly interface

## 🏗️ Technology Architecture

### Frontend
- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Hooks
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Framework**: FastAPI (Python)
- **AI Integration**: OpenAI Python SDK
- **Tools**: File Search + Web Search Preview
- **Streaming**: Server-Sent Events (SSE)
- **Configuration**: Environment-based settings

### Deployment
- **Containerization**: Docker + Docker Compose
- **Development**: Hot reload for both frontend and backend
- **Production**: Optimized builds

## 📋 Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.0.0 or higher
- **OpenAI API Key**: Account with GPT-4.1 access
- **Docker** (optional): For container-based development

## 🚀 Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/leadership_coach.git
cd leadership_coach
```

### 2. Set Up Environment Variables
```bash
# Create .env file
cp .env.example .env

# Edit .env file
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Install Node.js Dependencies
```bash
npm install
```

### 5. Vector Store Configuration (Optional)
For file search functionality, update the `vector_store_ids` in `api/utils/prompt.py` with your own vector store ID.

## 🎮 Running the Application

### Development Mode

#### Option 1: Run services separately
```bash
# Terminal 1: Backend (FastAPI)
npm run fastapi-dev

# Terminal 2: Frontend (Next.js)
npm run next-dev
```

#### Option 2: Run concurrently
```bash
npm run dev
```

#### Option 3: Docker
```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`.

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/chat` | POST | Chat with leadership coach |
| `/api/chat/reset` | POST | Reset conversation history |
| `/api/chat/history` | GET | Get current conversation history |
| `/api/youtube/process` | POST | Process YouTube playlist and create vector store |

## 💬 Usage Examples

### Leadership Questions
```
"What are the key qualities of an effective leader?"
"How can I improve my team's communication?"
"What strategies can I use for better decision making?"
"How do I handle conflict in my team?"
"What professional development goals should I set?"
```

### Business Intelligence Questions
```
"Which company received the largest investment in 2024?"
"What are the current market trends?"
"What are digital transformation strategies?"
```

## 📁 Project Structure

```
leadership_coach/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 (chat)/            # Chat pages
│   ├── 📁 api/               # API route handlers
│   └── layout.tsx            # Main layout
├── 📁 components/            # React components
│   ├── chat.tsx             # Main chat component
│   ├── message.tsx          # Message component
│   ├── multimodal-input.tsx # Input component
│   └── 📁 ui/               # UI components
├── 📁 api/                  # FastAPI backend
│   ├── 📁 services/         # Business logic services
│   │   └── leadership_coach.py
│   ├── 📁 utils/            # Utility functions
│   │   └── prompt.py        # AI configuration
│   └── index.py             # FastAPI main file
├── 📁 assets/               # Static files
├── 📁 hooks/                # React hooks
├── 📁 lib/                  # Helper libraries
├── docker-compose.yml       # Docker configuration
├── Dockerfile.frontend      # Frontend Docker
├── Dockerfile.backend       # Backend Docker
├── package.json             # Node.js dependencies
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🔧 Development

### Backend Development
- **FastAPI**: Modern Python web framework
- **Async/Await**: Asynchronous programming
- **Streaming**: Real-time response streaming
- **OpenAI Integration**: GPT-4.1 Responses API

### Frontend Development
- **App Router**: Next.js 13 new routing system
- **TypeScript**: Type safety
- **Tailwind**: Utility-first CSS
- **shadcn/ui**: Modern UI components

### Key Files
- `api/services/leadership_coach.py`: Main AI service
- `api/utils/prompt.py`: AI system prompt and tool configuration
- `components/chat.tsx`: Main chat component
- `components/multimodal-input.tsx`: User input component

## 🐳 Docker Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## 🔐 Security

- API keys stored in environment variables
- Input validation and sanitization
- Rate limiting (recommended for production)
- CORS configuration

## 🚨 Troubleshooting

### Common Issues

1. **OpenAI API Key Error**
   ```bash
   # Check .env file
   cat .env | grep OPENAI_API_KEY
   ```

2. **Port Conflicts**
   ```bash
   # Check ports
   lsof -i :3000
   lsof -i :8000
   ```

3. **Python Dependency Error**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   # venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   ```

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

⚡ **AI-powered coaching experience for modern leadership** ⚡


