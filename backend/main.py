from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import paraphraser, humanizer, ocr, quiz_maker, profile, admin, pdf_converter

app = FastAPI(title="UConvertIT API", version="1.0.0")

# ✅ ONLY THIS BLOCK CHANGED
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(paraphraser.router, prefix="/api", tags=["Paraphraser"])
app.include_router(humanizer.router, prefix="/api", tags=["Humanizer"])
app.include_router(ocr.router, prefix="/api", tags=["OCR"])
app.include_router(quiz_maker.router, prefix="/api", tags=["Quiz Maker"])
app.include_router(profile.router, prefix="/api", tags=["Profile"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(pdf_converter.router, prefix="/api", tags=["Convert PDF"])

@app.get("/")
def root():
    return {"message": "UConvertIT Backend is running! 🚀"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/list-models")
async def list_models():
    import httpx
    import os
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini_key}"
        )
    
    return response.json()