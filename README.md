# Leadership Coach Chatbot

A professional leadership coaching chatbot powered by OpenAI's GPT-4.1 model with file search and web search capabilities. Built with Next.js frontend and FastAPI backend.

## Features

- **Leadership Guidance**: Provides in-depth guidance on leadership practices and professional development
- **File Search**: Searches through uploaded documents for relevant information
- **Web Search**: Performs internet searches when additional context is needed
- **Streaming Responses**: Real-time streaming chat responses
- **Professional Tone**: Maintains a professional and insightful tone suitable for business professionals
- **Conversation Memory**: Maintains conversation history for context

## Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-sdk-preview-python-streaming
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Configure Vector Store** (Optional)
   If you want to use file search capabilities, update the `vector_store_ids` in `api/utils/prompt.py` with your own vector store ID.

## Running the Application

1. **Start the FastAPI backend**
   ```bash
   npm run fastapi-dev
   ```

2. **Start the Next.js frontend** (in a new terminal)
   ```bash
   npm run next-dev
   ```

3. **Or run both simultaneously**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## API Endpoints

- `POST /api/chat` - Send a message to the leadership coach
- `POST /api/chat/reset` - Reset the conversation history
- `GET /api/chat/history` - Get the current conversation history
- `GET /api/health` - Health check endpoint

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Start asking questions about leadership, professional development, or business intelligence
3. The coach will provide personalized, professional guidance
4. Use the "Reset" button to start a new conversation

## Example Questions

- "What are the key qualities of an effective leader?"
- "How can I improve my team's communication?"
- "What strategies can I use for better decision making?"
- "How do I handle conflict in my team?"
- "What are some professional development goals I should set?"

## Features in Detail

### File Search
The leadership coach can search through uploaded documents in the configured vector store to provide context-aware responses based on your organization's materials.

### Web Search
When the available documents don't contain sufficient information, the coach performs internet searches to provide comprehensive and up-to-date guidance.

### Professional Tone
The chatbot is specifically designed to maintain a professional and insightful tone appropriate for business environments.

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **AI**: OpenAI GPT-4.1 with Responses API
- **Tools**: File Search, Web Search Preview

## Development

The application consists of:

- **Frontend** (`components/`, `app/`): Next.js React application
- **Backend** (`api/`): FastAPI Python application
- **Services** (`api/services/`): Business logic for the leadership coach
- **Utils** (`api/utils/`): Configuration and utility functions

## License

MIT License
# leadership_coach
