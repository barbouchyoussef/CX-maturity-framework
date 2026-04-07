from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.assessments import router as assessments_router
from routers.sectors import router as sectors_router
from routers.dimensions import router as dimensions_router
from routers.subdimensions import router as subdimensions_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessments_router)
app.include_router(sectors_router)
app.include_router(dimensions_router)
app.include_router(subdimensions_router)