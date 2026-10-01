from typing import TypedDict

from langgraph.graph import StateGraph, START, END
from sqlalchemy.orm import Session

from ..services.vector_service import search_similar_chunks
from ..services.llm_service import generate_answer
from ..services.redis_service import (
    get_cache,
    set_cache,
    create_cache_key
)
from ..database import SessionLocal
from ..models import Document


class KnowledgeState(TypedDict):
    question: str
    context: str
    answer: str
    sources: list
    context_found: bool


def retrieve_node(state: KnowledgeState):

    results = search_similar_chunks(
        query=state["question"],
        top_k=3
    )

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]

    context_parts = []
    sources = []

    db: Session = SessionLocal()

    try:

        for document, metadata in zip(documents, metadatas):

            document_id = metadata["document_id"]
            page_number = metadata["page_number"]

            document_record = db.query(Document).filter(
                Document.id == document_id
            ).first()

            filename = "Unknown"

            if document_record:
                filename = document_record.filename

            context_parts.append(
                f"""
Document: {filename}
Document ID: {document_id}
Page: {page_number}

Content:
{document}
"""
            )

            source = {
                "document_id": document_id,
                "filename": filename,
                "page_number": page_number
            }

            if source not in sources:
                sources.append(source)

    finally:
        db.close()

    context = "\n".join(context_parts)

    return {
        "context": context,
        "sources": sources,
        "context_found": len(documents) > 0
    }


def check_context_node(state: KnowledgeState):

    if state["context_found"]:
        return {
            "context_found": True
        }

    return {
        "context_found": False
    }


def generate_node(state: KnowledgeState):

    answer = generate_answer(
        question=state["question"],
        context=state["context"]
    )

    return {
        "answer": answer
    }


def fallback_node(state: KnowledgeState):

    return {
        "answer": "I could not find this information in the provided documents.",
        "sources": []
    }


graph = StateGraph(KnowledgeState)

graph.add_node("retrieve", retrieve_node)
graph.add_node("check_context", check_context_node)
graph.add_node("generate", generate_node)
graph.add_node("fallback", fallback_node)

graph.add_edge(
    START,
    "retrieve"
)

graph.add_edge(
    "retrieve",
    "check_context"
)

graph.add_conditional_edges(
    "check_context",
    lambda state: (
        "generate"
        if state["context_found"]
        else "fallback"
    )
)

graph.add_edge(
    "generate",
    END
)

graph.add_edge(
    "fallback",
    END
)

knowledge_graph = graph.compile()


def ask_knowledge_agent(question: str):

    cache_key = create_cache_key(question)

    cached_result = get_cache(cache_key)

    if cached_result:
        print("Returning answer from Redis cache.")
        return cached_result

    result = knowledge_graph.invoke({
        "question": question,
        "context": "",
        "answer": "",
        "sources": [],
        "context_found": False
    })

    response = {
        "question": question,
        "answer": result["answer"],
        "sources": result["sources"]
    }

    set_cache(
        key=cache_key,
        value=response,
        expire=3600
    )

    print("Answer generated and saved to Redis.")

    return response