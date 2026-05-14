from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import paraphraser, humanizer, ocr, quiz_maker, profile, admin, pdf_converter

app = FastAPI(title="UConvertIT API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://u-convertit-frontend.vercel.app",  # ✅ add your Vercel production domain
    ],
    allow_origin_regex=r"^https://.*\.vercel\.app$",  # ✅ allow Vercel preview deployments (optional but recommended)
    allow_credentials=True,
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