from fastapi import APIRouter, Depends
from pydantic import BaseModel
from controllers.speech_controller import transcribe_speech
from python.main import auth_middleware

router = APIRouter()

class SpeechRequest(BaseModel):
    audio: str
    languageCode: str

@router.post("/", dependencies=[Depends(auth_middleware)])
async def transcribe_speech_route(speech: SpeechRequest):
    return await transcribe_speech(speech.audio, speech.languageCode)