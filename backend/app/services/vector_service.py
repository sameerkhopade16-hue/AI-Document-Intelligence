import chromadb


client = chromadb.PersistentClient(
    path="vectorstore"
)

collection = client.get_or_create_collection(
    name="documents"
)


def add_document_chunk(
    chunk_id,
    content,
    document_id,
    page_number
):
    from .embedding_service import create_embedding

    embedding = create_embedding(content)

    collection.add(
        ids=[str(chunk_id)],
        embeddings=[embedding],
        documents=[content],
        metadatas=[{
            "document_id": document_id,
            "page_number": page_number
        }]
    )


def search_similar_chunks(
    query,
    top_k=3,
    distance_threshold=1.4
):
    from .embedding_service import create_embedding

    query_embedding = create_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    if not results["documents"] or not results["documents"][0]:
        return {
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]]
        }

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    filtered_documents = []
    filtered_metadatas = []
    filtered_distances = []

    for document, metadata, distance in zip(
        documents,
        metadatas,
        distances
    ):

        if distance <= distance_threshold:

            filtered_documents.append(document)
            filtered_metadatas.append(metadata)
            filtered_distances.append(distance)

    return {
        "documents": [filtered_documents],
        "metadatas": [filtered_metadatas],
        "distances": [filtered_distances]
    }