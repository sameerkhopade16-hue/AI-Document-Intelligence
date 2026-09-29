import os
import shutil

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Document, DocumentChunk
from ..services.pdf_service import extract_text_from_pdf
from ..services.chunk_service import create_chunks
from ..services.vector_service import add_document_chunk
from ..services.redis_service import clear_chat_cache
from ..services.vector_service import collection


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )


    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )


    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )


    pages = extract_text_from_pdf(
        file_path
    )


    document = Document(
        filename=file.filename,
        file_type="pdf",
        status="processed"
    )


    db.add(document)

    db.commit()

    db.refresh(document)


    chunks = create_chunks(
        pages
    )


    for chunk in chunks:

        document_chunk = DocumentChunk(
            document_id=document.id,
            chunk_index=chunk["chunk_index"],
            content=chunk["content"],
            page_number=chunk["page_number"]
        )


        db.add(document_chunk)

        db.commit()

        db.refresh(document_chunk)


        add_document_chunk(
            chunk_id=document_chunk.id,
            content=document_chunk.content,
            document_id=document_chunk.document_id,
            page_number=document_chunk.page_number
        )


    # Clear old chat cache after adding a new document
    clear_chat_cache()


    return {
        "message": "Document uploaded and processed successfully",
        "document_id": document.id,
        "filename": document.filename,
        "status": document.status,
        "total_pages": len(pages),
        "total_chunks": len(chunks)
    }


@router.get("/")
def get_documents(
    db: Session = Depends(get_db)
):

    documents = db.query(Document).order_by(
        Document.uploaded_at.desc()
    ).all()


    return documents


@router.get("/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()


    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )


    return document


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()


    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )


    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id
    ).all()


    chunk_ids = [
        str(chunk.id)
        for chunk in chunks
    ]


    # Delete vectors from Chroma
    if chunk_ids:

        collection.delete(
            ids=chunk_ids
        )


    # Delete chunks from PostgreSQL
    for chunk in chunks:

        db.delete(chunk)


    # Flush chunk deletions before deleting parent document
    db.flush()


    # Delete uploaded PDF
    file_path = os.path.join(
        UPLOAD_DIR,
        document.filename
    )


    if os.path.exists(file_path):

        os.remove(
            file_path
        )


    # Delete document from PostgreSQL
    db.delete(document)

    db.commit()


    # Clear old chat cache after deleting a document
    clear_chat_cache()


    return {
        "message": "Document deleted successfully",
        "document_id": document_id,
        "filename": document.filename
    }