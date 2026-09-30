from langchain_text_splitters import RecursiveCharacterTextSplitter


def create_chunks(pages):

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = []

    chunk_index = 0

    for page in pages:

        page_chunks = text_splitter.split_text(
            page["text"]
        )

        for chunk in page_chunks:

            chunks.append({
                "chunk_index": chunk_index,
                "content": chunk,
                "page_number": page["page_number"]
            })

            chunk_index += 1

    return chunks