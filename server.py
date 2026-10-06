from fastapi import FastAPI, UploadFile, File, Request
import cv2
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from deepface import DeepFace
from PIL import Image
import io
import os
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "database_photos"
os.makedirs(DB_PATH, exist_ok=True)
app.mount("/photos", StaticFiles(directory=DB_PATH), name="photos")

@app.post("/upload")
async def upload_photographer_photo(file: UploadFile = File(...)):
    # Format conversion
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    if image.mode != 'RGB':
        image = image.convert('RGB')
        
    base_name = os.path.splitext(file.filename)[0]
    new_filename = f"{base_name}_{int(time.time())}.jpg"
    file_location = os.path.join(DB_PATH, new_filename)
    
    image.save(file_location, "JPEG")
    
    # Invalidate cache
    for f in os.listdir(DB_PATH):
        if f.endswith(".pkl"):
            os.remove(os.path.join(DB_PATH, f))

    return {"status": "success"}

@app.post("/scan")
async def scan_face(file: UploadFile = File(...)):
    # Format conversion
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    if image.mode != 'RGB':
        image = image.convert('RGB')
        
    temp_path = f"temp_selfie_{int(time.time())}.jpg"
    image.save(temp_path, "JPEG")
    
    try:
        dfs = DeepFace.find(
            img_path=temp_path, 
            db_path=DB_PATH, 
            model_name="VGG-Face", 
            detector_backend="mtcnn", 
            enforce_detection=True
        )
        
        matches = []
        if len(dfs) > 0 and not dfs[0].empty:
            for index, row in dfs[0].iterrows():
                file_name = os.path.basename(row['identity'])
                matches.append(f"/photos/{file_name}")
                
        os.remove(temp_path)
        return {"matches": matches}
    
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"Scan Error: {e}")
        return {"error": str(e), "matches": []}

@app.post("/generate_video")
async def generate_video(request: Request):
    data = await request.json()
    images = data.get("images", [])
    if not images:
        return {"error": "No images provided"}
        
    local_paths = [os.path.join(DB_PATH, os.path.basename(img)) for img in images]
    out_name = f"recap_{int(time.time())}.mp4"
    temp_path = f"temp_{out_name}"
    final_path = os.path.join(DB_PATH, out_name)
    
    fps = 30
    duration_per_image = 3
    transition_frames = 30
    frames_per_image = fps * duration_per_image
    width, height = 720, 1280 
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_path, fourcc, fps, (width, height))
    
    def process_image(img_path):
        img = cv2.imread(img_path)
        if img is None:
            return np.zeros((height, width, 3), dtype=np.uint8)
        h, w, _ = img.shape
        target_ratio = width / height
        img_ratio = w / h
        if img_ratio > target_ratio:
            new_w = int(h * target_ratio)
            start_x = (w - new_w) // 2
            img = img[:, start_x:start_x+new_w]
        else:
            new_h = int(w / target_ratio)
            start_y = (h - new_h) // 2
            img = img[start_y:start_y+new_h, :]
        return cv2.resize(img, (width, height))

    processed_images = [process_image(p) for p in local_paths]
    
    for i in range(len(processed_images)):
        img1 = processed_images[i]
        img2 = processed_images[i+1] if i+1 < len(processed_images) else processed_images[0]
        
        for frame_idx in range(frames_per_image):
            zoom = 1.0 + 0.1 * (frame_idx / frames_per_image)
            zh = int(height / zoom)
            zw = int(width / zoom)
            y1 = (height - zh) // 2
            x1 = (width - zw) // 2
            cropped = img1[y1:y1+zh, x1:x1+zw]
            frame = cv2.resize(cropped, (width, height))
            
            if frame_idx >= frames_per_image - transition_frames and i < len(processed_images) - 1:
                alpha = (frame_idx - (frames_per_image - transition_frames)) / transition_frames
                zoom2 = 1.0 + 0.1 * (alpha * transition_frames / frames_per_image)
                zh2 = int(height / zoom2)
                zw2 = int(width / zoom2)
                y12 = (height - zh2) // 2
                x12 = (width - zw2) // 2
                cropped2 = img2[y12:y12+zh2, x12:x12+zw2]
                frame2 = cv2.resize(cropped2, (width, height))
                frame = cv2.addWeighted(frame, 1 - alpha, frame2, alpha, 0)
                
            out.write(frame)
            
    out.release()
    
    music_path = "music.mp3"
    if os.path.exists(music_path):
        # Audio muxing
        os.system(f"ffmpeg -y -i {temp_path} -stream_loop -1 -i {music_path} -vcodec libx264 -acodec aac -map 0:v:0 -map 1:a:0 -shortest {final_path}")
    else:
        os.system(f"ffmpeg -y -i {temp_path} -vcodec libx264 {final_path}")
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    return {"video_url": f"/photos/{out_name}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
