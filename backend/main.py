from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import paraphraser, humanizer, ocr  # ← add ocr

app = FastAPI(title="UConvertIT API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(paraphraser.router, prefix="/api", tags=["Paraphraser"])
app.include_router(humanizer.router, prefix="/api", tags=["Humanizer"])
app.include_router(ocr.router, prefix="/api", tags=["OCR"])  # ← add this

@app.get("/")
def root():
    return {"message": "UConvertIT Backend is running! 🚀"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}