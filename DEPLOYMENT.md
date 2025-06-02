# Vercel Deployment Guide

## Prerequisites

Before deploying, make sure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## Environment Variables

You need to set the following environment variables in your Vercel project:

1. `OPENAI_API_KEY` - Your OpenAI API key (required for the AI functionality)

### Setting Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the required variables

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. Connect your GitHub repository to Vercel
2. Push your code to the main branch
3. Vercel will automatically deploy

## Project Structure

This is a hybrid Next.js + FastAPI application:

- **Frontend**: Next.js (React) application in the root directory
- **Backend**: FastAPI Python application in the `api/` directory
- **Configuration**: 
  - `vercel.json` - Vercel deployment configuration
  - `package.json` - Node.js dependencies and build scripts
  - `requirements.txt` - Python dependencies

## Build Process

The application uses:
- `@vercel/static-build` for the Next.js frontend
- `@vercel/python` for the FastAPI backend

## API Endpoints

After deployment, your API will be available at:
- `https://your-app.vercel.app/api/chat` - Main chat endpoint
- `https://your-app.vercel.app/api/chat/reset` - Reset conversation
- `https://your-app.vercel.app/api/chat/history` - Get chat history

## Troubleshooting

### Common Issues:

1. **Environment Variables**: Make sure `OPENAI_API_KEY` is set in Vercel
2. **Python Dependencies**: All dependencies are specified in `requirements.txt`
3. **Import Errors**: The code handles both development and production imports

### Debug Steps:

1. Check Vercel function logs in the dashboard
2. Verify environment variables are set
3. Ensure all required files are committed to your repository

## Local Development

For local development:

```bash
npm run dev
```

This will start both the Next.js frontend and FastAPI backend concurrently. 