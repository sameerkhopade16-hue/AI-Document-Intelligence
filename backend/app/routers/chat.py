from fastapi import APIRouter

from ..schemas.chat import ChatRequest
from ..agents.knowledge_agent import ask_knowledge_agent


router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


@router.post("/")
def chat(request: ChatRequest):

    result = ask_knowledge_agent(
        question=request.question
    )

    return result   