from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn

# Import your existing functions
from event_finder import get_meetup_recommendations  # Adjust import path as needed

app = FastAPI(title="Meetup Recommendations API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to your frontend's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationQuery(BaseModel):
    latitude: float = Field(..., description="User's latitude")
    longitude: float = Field(..., description="User's longitude")
    interests: str = Field(..., description="User's interests as a text description")
    num_events: Optional[int] = Field(default=10, description="Number of events to fetch")
    verbose: Optional[bool] = Field(default=False, description="Enable verbose output")

@app.post("/api/recommendations")
async def get_recommendations(query: LocationQuery):
    try:
        recommendations = get_meetup_recommendations(
            lat=query.latitude,
            lon=query.longitude,
            interests=query.interests,
            num_events=query.num_events,
            verbose=query.verbose
        )
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)