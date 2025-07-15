from fastapi import APIRouter, Depends
from pydantic import BaseModel
from controllers.description_controller import generate_description
from python.main import auth_middleware

router = APIRouter()

class DescriptionRequest(BaseModel):
    text: str

@router.post("/", dependencies=[Depends(auth_middleware)])
async def generate_description_route(request: DescriptionRequest):
    return await generate_description(request.text)