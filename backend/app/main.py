from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models
from .routers import documents, chat


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Document Intelligence & Enterprise Knowledge Assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5501",
        "http://localhost:5501"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():
    return {
        "message": "AI Document Intelligence API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


app.include_router(documents.router)
app.include_router(chat.router)