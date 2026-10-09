# AI Document Intelligence & Enterprise Knowledge Assistant

An AI-powered enterprise knowledge assistant that allows users to upload PDF documents, ask questions about their contents, and receive context-aware answers with source references using Retrieval-Augmented Generation (RAG).

## Overview

The AI Document Intelligence & Enterprise Knowledge Assistant transforms unstructured PDF documents into searchable knowledge. It extracts text, divides it into smaller chunks, generates embeddings, and retrieves relevant information to answer user questions.

The system combines semantic search, large language models, and an agent workflow to provide document-grounded answers and a fallback response when relevant information cannot be found.

## Key Features

* **PDF Document Upload:** Upload and process PDF documents through a web dashboard.
* **Text Extraction:** Extract text from PDF pages using PyPDF.
* **Text Chunking:** Split extracted text into chunks of 500 characters with 50-character overlap.
* **Semantic Search:** Generate text embeddings using Sentence Transformers and retrieve relevant chunks through ChromaDB.
* **RAG-Based Question Answering:** Generate answers using retrieved document context and the Groq-hosted `openai/gpt-oss-120b` model.
* **Agentic Workflow:** Use LangGraph to manage retrieval, context validation, answer generation, and fallback handling.
* **Source References:** Display source document filenames and page numbers alongside answers.
* **Document Management:** View, search, upload, and delete documents.
* **Response Caching:** Use Redis to cache repeated questions and clear cached answers when documents change.
* **REST API:** Expose backend functionality through FastAPI endpoints.

## Technology Stack

| Category             | Technologies                               |
| -------------------- | ------------------------------------------ |
| Programming Language | Python                                     |
| Backend              | FastAPI, REST APIs                         |
| Database             | PostgreSQL                                 |
| Vector Database      | ChromaDB                                   |
| Embeddings           | Sentence Transformers (`all-MiniLM-L6-v2`) |
| AI / LLM             | Groq API, `openai/gpt-oss-120b`            |
| RAG & Orchestration  | LangChain Text Splitters, LangGraph        |
| Caching              | Redis                                      |
| PDF Processing       | PyPDF                                      |
| Frontend             | HTML, CSS, JavaScript                      |
| API Testing          | Postman, FastAPI Swagger UI                |
| Version Control      | Git, GitHub                                |

## System Architecture

```text
              User
                |
                v
       Web Dashboard
       HTML / CSS / JS
                |
                v
          FastAPI Backend
                |
        +-------+--------+
        |                |
        v                v
 Document Upload     Chat Question
        |                |
        v                v
   PDF Extraction    Redis Cache
        |                |
        v          Cache Miss
   Text Chunking         |
        |                v
        v          LangGraph Agent
 Sentence Transformers   |
        |                v
        v          ChromaDB Search
     ChromaDB             |
        |                v
        |          Context Validation
        |                |
        |          +-----+------+
        |          |            |
        |          v            v
        |       Generate     Fallback
        |        Answer
        |          |
        +----------+
                   |
                   v
         Answer with Sources
```

PostgreSQL stores document metadata and extracted chunks. Redis caches question-answer responses. ChromaDB stores document embeddings for semantic retrieval.

## How It Works

1. **Upload:** The user uploads a PDF through the dashboard.
2. **Extract:** PyPDF extracts text from individual pages.
3. **Chunk:** The text is split into chunks of 500 characters with 50-character overlap.
4. **Embed:** Sentence Transformers converts each chunk into a numerical embedding.
5. **Index:** ChromaDB stores embeddings, document content, and associated metadata.
6. **Ask:** The user submits a question through the chat interface.
7. **Retrieve:** The system searches for relevant document chunks using semantic similarity.
8. **Validate:** The LangGraph workflow checks whether relevant context was retrieved.
9. **Generate:** The LLM generates an answer based on the retrieved context, or the system returns a fallback response.
10. **Cite and Cache:** The answer includes source filenames and page numbers and is cached in Redis for repeated queries.

## Project Structure

```text
AI-Document-Intelligence/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   └── knowledge_agent.py
│   │   ├── routers/
│   │   │   ├── documents.py
│   │   │   └── chat.py
│   │   ├── schemas/
│   │   │   ├── chat.py
│   │   │   └── document.py
│   │   ├── services/
│   │   │   ├── pdf_service.py
│   │   │   ├── chunk_service.py
│   │   │   ├── embedding_service.py
│   │   │   ├── vector_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── rag_service.py
│   │   │   └── redis_service.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── main.py
│   ├── uploads/
│   ├── vectorstore/
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .gitignore
└── README.md
```

## Installation and Setup

### Prerequisites

Install or configure the following:

* Python 3.10 or a compatible version for the dependencies
* PostgreSQL
* Redis or a compatible Redis Cloud instance
* A Groq API key
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/sameerkhopade16-hue/AI-Document-Intelligence.git
cd AI-Document-Intelligence
```

### 2. Create a Virtual Environment

```bash
cd backend
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
GROQ_API_KEY=YOUR_GROQ_API_KEY
REDIS_URL=YOUR_REDIS_CONNECTION_URL
```

Replace the placeholders with your own credentials. Create the PostgreSQL database before starting the application.

**Security:** Never commit `.env` or expose API keys, database passwords, or Redis credentials in your repository.

### 5. Start the Backend

From the `backend/` directory, run:

```bash
python -m uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 6. Run the Frontend

Open `frontend/index.html` using a local development server, such as the VS Code Live Server extension.

If using the configured local frontend port, open:

```text
http://127.0.0.1:5501
```

The frontend API URL and FastAPI CORS settings must match the address used by the local development server.

## API Endpoints

| Method | Endpoint                   | Description                               |
| ------ | -------------------------- | ----------------------------------------- |
| GET    | `/`                        | Check that the API is running             |
| GET    | `/health`                  | Check API health                          |
| POST   | `/documents/upload`        | Upload and process a PDF                  |
| GET    | `/documents/`              | List uploaded documents                   |
| GET    | `/documents/{document_id}` | Retrieve document details                 |
| DELETE | `/documents/{document_id}` | Delete a document and its associated data |
| POST   | `/chat/`                   | Ask a question about the documents        |

### Example Chat Request

**Endpoint:** `POST /chat/`

```json
{
  "question": "Explain the LRU page replacement algorithm"
}
```

The response contains the question, generated answer, and source information when relevant content is found.

## Configuration

| Setting                       | Value                 |
| ----------------------------- | --------------------- |
| Chunk size                    | 500 characters        |
| Chunk overlap                 | 50 characters         |
| Embedding model               | `all-MiniLM-L6-v2`    |
| Default retrieval count       | 3 chunks              |
| Similarity distance threshold | 1.4                   |
| Redis cache expiration        | 3600 seconds (1 hour) |

These are the current project settings and can be tuned as the retrieval system is evaluated.

## Testing

You can test the backend using:

* FastAPI Swagger UI at `/docs`
* Postman for upload, document management, and chat requests
* Questions whose answers are present in uploaded PDFs
* Questions whose answers are absent from the documents, to verify fallback behavior
* Repeated questions, to verify Redis caching

## Limitations and Deployment Notes

* The assistant's answer quality depends on the text extracted from uploaded PDFs and the relevance of retrieved chunks.
* Scanned PDFs may require OCR, which is not currently part of the described extraction pipeline.
* Redis cache entries are cleared when documents are uploaded or deleted.
* ChromaDB currently uses a local persistent directory, and uploaded PDFs are stored locally.
* A cloud deployment must account for persistent file and vector storage. Ephemeral filesystems can lose uploaded documents and vector data after a restart or redeployment.
* Database, Redis, and LLM service availability depends on their configuration and provider limits.

## Future Enhancements

* Add OCR support for scanned PDFs.
* Add authentication, authorization, and user-specific document access.
* Support additional file formats such as DOCX and TXT.
* Improve retrieval through hybrid search and reranking.
* Add automated tests and retrieval-quality evaluation.
* Configure persistent cloud storage and deploy the application with a public URL.

## Author

**Sameer Khopade**

B.Sc. Computer Science graduate interested in backend development, Machine Learning, Generative AI, and RAG-based applications.

* **GitHub:** https://github.com/sameerkhopade16-hue
* **Project Repository:** https://github.com/sameerkhopade16-hue/AI-Document-Intelligence

---

*Built as a practical project exploring document processing, semantic search, RAG, agent orchestration, backend APIs, and caching.*
