import os

from fastapi import FastAPI, HTTPException
import httpx

app = FastAPI()

OLLAMA_URL = "http://ollama:11434"
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3")

@app.get("/health")
def health():
     return {"status": "ok"}

@app.post("/chat")
async def chat(payload: dict):
     try:
          if not payload.get("model"):
               payload["model"] = DEFAULT_MODEL
          async with httpx.AsyncClient() as client:
               resp = await client.post(
                    f"{OLLAMA_URL}/api/chat",
                    json=payload,
                    timeout=60
               )
               resp.raise_for_status()
               return resp.json()
     except httpx.HTTPError as e:
          raise HTTPException(status_code=502, detail=str(e))