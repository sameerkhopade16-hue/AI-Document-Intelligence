from .vector_service import search_similar_chunks
from .llm_service import generate_answer


def answer_question(question, top_k=3):

    results = search_similar_chunks(
        query=question,
        top_k=top_k
    )

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]

    context_parts = []

    for document, metadata in zip(documents, metadatas):
        context_parts.append(
            f"""
Source:
Document ID: {metadata["document_id"]}
Page: {metadata["page_number"]}

Content:
{document}
"""
        )

    context = "\n".join(context_parts)

    answer = generate_answer(
        question=question,
        context=context
    )

    return {
        "question": question,
        "answer": answer,
        "sources": metadatas
    }