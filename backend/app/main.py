import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import auth, asiakkaat, kaynnit, poikkeukset, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hoivakalenteri API")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(asiakkaat.router)
app.include_router(kaynnit.router)
app.include_router(poikkeukset.router)

@app.get("/")
def root():
    return {"status": "ok"}
