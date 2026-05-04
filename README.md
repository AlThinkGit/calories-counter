# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with Docker

### Option 1: Docker build/run

1. Build image:
   `docker build -t calories-counter --build-arg VITE_GEMINI_API_KEY=your_key_here .`
2. Run container:
   `docker run --rm -p 8080:80 calories-counter`
3. Open:
   `http://localhost:8080`

### Option 2: Docker Compose

1. Create a `.env` file in project root:
   `VITE_GEMINI_API_KEY=your_key_here`
2. Start service:
   `docker compose up --build`
3. Open:
   `http://localhost:8080`
