# EventSnap AI 📸 

An AI-powered event photography platform that allows guests to instantly find all their photos from an event by simply taking a selfie. Built with a modern React frontend and a robust Python (DeepFace) backend, the system also auto-generates cinematic, music-backed video reels for social media sharing.

## 🌟 Features

- **Instant Facial Recognition:** Guests take a selfie, and the system instantly scans thousands of event photos to find every picture they appear in.
- **AI Video Reel Generator:** Automatically stitches a guest's matched photos into a cinematic, zooming video reel with background music, ready for Instagram or TikTok.
- **Photographer Portal:** A dedicated bulk-upload zone for photographers to drag-and-drop massive batches of event photos with automatic in-browser compression.
- **Privacy First:** Selfies are processed instantly and discarded. No facial data is stored after the search.

## 🏗️ System Architecture

The project is split into two main components:

1. **Frontend (React + Vite):**
   - A responsive, glassmorphism-themed UI.
   - Compresses heavy images directly in the browser using `browser-image-compression` to save bandwidth.
   - Communicates with the backend REST API.

2. **Backend (Python FastAPI + DeepFace):**
   - Hosted in an isolated Docker container.
   - Uses **VGG-Face** and **MTCNN** AI models to extract facial vectors and perform high-speed cosine similarity matching.
   - Uses **OpenCV** and **FFmpeg** to generate the dynamic video reels.

## 🚀 How to Install and Run Locally

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (3.10 or higher) or **Docker**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/EventSnap-AI.git
cd EventSnap-AI
```

### 2. Start the Backend Server (Docker Method - Recommended)
The easiest way to run the AI engine without installing heavy machine learning libraries on your computer is using Docker. Run this from the root directory:

```bash
docker run -d -p 8000:8000 -v $(pwd):/app -w /app python:3.10 bash -c "apt-get update && apt-get install -y libgl1 ffmpeg && pip install --no-cache-dir deepface chromadb opencv-python tf-keras fastapi uvicorn python-multipart && uvicorn server:app --host 0.0.0.0 --port 8000"
```
*Note: The first time you run this, it will take a few minutes to download the AI weights.* The API will be available at `http://localhost:8000`.

### 3. Start the Frontend Application
Open a new terminal window, navigate to the `frontend` folder, and install the dependencies:

```bash
cd frontend
npm install
```

Next, ensure your `.env` file points to the backend. Create a `.env` file in the `frontend` folder (if it doesn't exist) and add:
```env
VITE_API_URL=http://localhost:8000
```

Finally, start the React server:
```bash
npm run dev
```

The app will open in your browser at `http://localhost:5174`.

## 📖 How it Works (Step-by-Step)

1. **Photographer Uploads:** The event photographer goes to the Photographer Portal and uploads photos. The React frontend compresses them and sends them to the backend `/upload` endpoint, where they are saved to the `database_photos` directory.
2. **AI Indexing:** When a guest uploads a selfie to the Scanner portal, the backend `/scan` endpoint wakes up. The `DeepFace` library scans the `database_photos` folder, creates an optimized `.pkl` cache of facial vectors, and compares them against the guest's selfie.
3. **Display & Share:** The frontend receives the matched photos and displays them. The guest can download them or share them directly to WhatsApp/Twitter/Instagram.
4. **Reel Generation:** If the guest clicks "Create AI Video Reel", the `/generate_video` endpoint uses OpenCV to apply a "Ken Burns" zoom effect to the photos, and uses FFmpeg to mux a royalty-free `music.mp3` track onto the final `.mp4` video.

## 📝 License
This project is licensed under the MIT License.
