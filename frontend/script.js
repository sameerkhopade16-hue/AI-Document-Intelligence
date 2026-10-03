const API_URL = "http://127.0.0.1:8000";

let selectedFile = null;
let allDocuments = [];


// ============================================================
// DOM ELEMENTS
// ============================================================

const documentFile = document.getElementById("documentFile");
const dropZone = document.getElementById("dropZone");
const chooseFileButton = document.getElementById("chooseFileButton");
const selectedFileElement = document.getElementById("selectedFile");
const uploadButton = document.getElementById("uploadButton");
const uploadMessage = document.getElementById("uploadMessage");

const documentsList = document.getElementById("documentsList");
const documentSearch = document.getElementById("documentSearch");
const documentCount = document.getElementById("documentCount");

const totalDocuments = document.getElementById("totalDocuments");
const processedDocuments = document.getElementById("processedDocuments");
const knowledgeSources = document.getElementById("knowledgeSources");

const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const chatMessages = document.getElementById("chatMessages");

const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebar = document.getElementById("sidebar");


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    loadDocuments();

    setupFileUpload();

    setupChat();

    setupDocumentSearch();

    setupSuggestions();

    setupMobileMenu();
});


// ============================================================
// LOAD DOCUMENTS
// ============================================================

async function loadDocuments() {

    try {

        showDocumentsLoading();

        const response = await fetch(
            `${API_URL}/documents/`
        );

        if (!response.ok) {
            throw new Error("Failed to load documents.");
        }

        const documents = await response.json();

        allDocuments = documents;

        updateStatistics(documents);

        displayDocuments(documents);

    } catch (error) {

        console.error("Load documents error:", error);

        showDocumentsError(
            "Unable to connect to the backend. Please make sure FastAPI is running."
        );
    }
}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics(documents) {

    const total = documents.length;

    const processed = documents.filter(
        doc => doc.status === "processed"
    ).length;


    if (totalDocuments) {
        totalDocuments.textContent = total;
    }

    if (processedDocuments) {
        processedDocuments.textContent = processed;
    }

    if (knowledgeSources) {
        knowledgeSources.textContent = total;
    }

    updateDocumentCount(documents.length);
}


// ============================================================
// DOCUMENT COUNT
// ============================================================

function updateDocumentCount(count) {

    if (!documentCount) {
        return;
    }

    documentCount.textContent =
        `${count} ${count === 1 ? "document" : "documents"}`;
}


// ============================================================
// DISPLAY DOCUMENTS
// ============================================================

function displayDocuments(documents) {

    documentsList.innerHTML = "";

    updateDocumentCount(documents.length);


    if (documents.length === 0) {

        const empty = document.createElement("div");

        empty.className = "empty-state";

        empty.innerHTML = `
            <div class="empty-icon">📄</div>
            <h3>No documents found</h3>
            <p>Upload a PDF to add knowledge to your assistant.</p>
        `;

        documentsList.appendChild(empty);

        return;
    }


    documents.forEach(doc => {

        const card = document.createElement("article");

        card.className = "document-card";


        // --------------------------------------------
        // Document icon
        // --------------------------------------------

        const icon = document.createElement("div");

        icon.className = "document-icon";

        icon.textContent = "PDF";


        // --------------------------------------------
        // Document information
        // --------------------------------------------

        const info = document.createElement("div");

        info.className = "document-info";


        const title = document.createElement("h3");

        title.textContent =
            doc.filename || "Unnamed document";


        const date = doc.uploaded_at
            ? new Date(doc.uploaded_at).toLocaleDateString()
            : "Unknown date";


        const meta = document.createElement("p");

        meta.textContent =
            `PDF • ID: ${doc.id} • Uploaded: ${date}`;


        const status = document.createElement("span");

        status.className =
            "document-status";


        status.textContent =
            doc.status || "processed";


        info.appendChild(title);

        info.appendChild(meta);

        info.appendChild(status);


        // --------------------------------------------
        // Delete button
        // --------------------------------------------

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "delete-button";

        deleteButton.textContent =
            "Delete";


        deleteButton.addEventListener(
            "click",
            () => deleteDocument(doc.id)
        );


        // --------------------------------------------
        // Card
        // --------------------------------------------

        card.appendChild(icon);

        card.appendChild(info);

        card.appendChild(deleteButton);

        documentsList.appendChild(card);
    });
}


// ============================================================
// DOCUMENT SEARCH
// ============================================================

function setupDocumentSearch() {

    if (!documentSearch) {
        return;
    }

    documentSearch.addEventListener(
        "input",
        () => {

            const searchText =
                documentSearch.value
                    .trim()
                    .toLowerCase();


            if (!searchText) {

                displayDocuments(allDocuments);

                return;
            }


            const filtered =
                allDocuments.filter(doc =>
                    (doc.filename || "")
                        .toLowerCase()
                        .includes(searchText)
                );


            displayDocuments(filtered);
        }
    );
}


// ============================================================
// FILE UPLOAD SETUP
// ============================================================

function setupFileUpload() {

    if (!documentFile) {
        console.error("documentFile element not found.");
        return;
    }


    // Choose PDF button
    if (chooseFileButton) {

        chooseFileButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                documentFile.click();
            }
        );
    }


    // Click anywhere in drop zone
    if (dropZone) {

        dropZone.addEventListener(
            "click",
            () => {

                documentFile.click();
            }
        );


        // Keyboard accessibility
        dropZone.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    documentFile.click();
                }
            }
        );


        // Drag over
        dropZone.addEventListener(
            "dragover",
            (event) => {

                event.preventDefault();

                dropZone.classList.add(
                    "drag-over"
                );
            }
        );


        // Drag leave
        dropZone.addEventListener(
            "dragleave",
            () => {

                dropZone.classList.remove(
                    "drag-over"
                );
            }
        );


        // Drop
        dropZone.addEventListener(
            "drop",
            (event) => {

                event.preventDefault();

                dropZone.classList.remove(
                    "drag-over"
                );


                const file =
                    event.dataTransfer.files[0];


                if (!file) {
                    return;
                }


                handleSelectedFile(file);
            }
        );
    }


    // File selected from Windows
    documentFile.addEventListener(
        "change",
        (event) => {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            handleSelectedFile(file);
        }
    );


    // Upload button
    if (uploadButton) {

        uploadButton.addEventListener(
            "click",
            uploadDocument
        );
    }
}


// ============================================================
// HANDLE SELECTED FILE
// ============================================================

function handleSelectedFile(file) {

    const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");


    if (!isPDF) {

        showUploadMessage(
            "Only PDF files are allowed.",
            "error"
        );

        selectedFile = null;

        documentFile.value = "";

        if (selectedFileElement) {
            selectedFileElement.textContent =
                "No file selected";
        }

        return;
    }


    selectedFile = file;


    if (selectedFileElement) {

        selectedFileElement.textContent =
            file.name;
    }


    showUploadMessage(
        "PDF selected and ready to upload.",
        "success"
    );
}


// ============================================================
// UPLOAD DOCUMENT
// ============================================================

async function uploadDocument() {

    if (!selectedFile) {

        showUploadMessage(
            "Please choose a PDF file first.",
            "error"
        );

        return;
    }


    try {

        uploadButton.disabled = true;

        uploadButton.innerHTML = `
            <span>Processing...</span>
            <span aria-hidden="true">⟳</span>
        `;


        showUploadMessage(
            "Uploading and processing your PDF...",
            "loading"
        );


        const formData = new FormData();

        formData.append(
            "file",
            selectedFile
        );


        const response = await fetch(
            `${API_URL}/documents/upload`,
            {
                method: "POST",
                body: formData
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Document upload failed."
            );
        }


        showUploadMessage(
            `Successfully processed ${data.filename}. ` +
            `${data.total_pages} pages and ${data.total_chunks} chunks created.`,
            "success"
        );


        // Reset file selection
        selectedFile = null;

        documentFile.value = "";


        if (selectedFileElement) {

            selectedFileElement.textContent =
                "No file selected";
        }


        // Reload documents
        await loadDocuments();


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );


        showUploadMessage(
            error.message ||
            "Unable to upload the document.",
            "error"
        );


    } finally {

        uploadButton.disabled = false;

        uploadButton.innerHTML = `
            <span>Upload & process</span>
            <span aria-hidden="true">↑</span>
        `;
    }
}


// ============================================================
// UPLOAD MESSAGE
// ============================================================

function showUploadMessage(
    message,
    type = ""
) {

    if (!uploadMessage) {
        return;
    }


    uploadMessage.textContent =
        message;


    uploadMessage.className =
        "upload-message";


    if (type) {

        uploadMessage.classList.add(
            type
        );
    }
}


// ============================================================
// DELETE DOCUMENT
// ============================================================

async function deleteDocument(documentId) {

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this document?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/documents/${documentId}`,
            {
                method: "DELETE"
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to delete document."
            );
        }


        await loadDocuments();


        showUploadMessage(
            "Document deleted successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete the document."
        );
    }
}


// ============================================================
// DOCUMENT LOADING
// ============================================================

function showDocumentsLoading() {

    documentsList.innerHTML = `
        <div class="loading-state">
            <span class="spinner"></span>
            <span>Loading your documents...</span>
        </div>
    `;
}


// ============================================================
// DOCUMENT ERROR
// ============================================================

function showDocumentsError(message) {

    documentsList.innerHTML = "";

    const error =
        document.createElement("div");

    error.className =
        "error-state";

    error.textContent =
        message;

    documentsList.appendChild(error);

    updateDocumentCount(0);
}


// ============================================================
// CHAT SETUP
// ============================================================

function setupChat() {

    if (!questionInput || !askButton) {
        return;
    }


    // Ask button
    askButton.addEventListener(
        "click",
        sendQuestion
    );


    // Enter = send
    questionInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendQuestion();
            }
        }
    );
}


// ============================================================
// SUGGESTIONS
// ============================================================

function setupSuggestions() {

    const suggestions =
        document.querySelectorAll(
            ".suggestion"
        );


    suggestions.forEach(
        suggestion => {

            suggestion.addEventListener(
                "click",
                () => {

                    const text =
                        suggestion.textContent.trim();


                    questionInput.value =
                        text;


                    questionInput.focus();

                    sendQuestion();
                }
            );
        }
    );
}


// ============================================================
// SEND QUESTION
// ============================================================

async function sendQuestion() {

    const question =
        questionInput.value.trim();


    if (!question) {
        return;
    }


    removeWelcomeMessage();


    addUserMessage(question);


    questionInput.value = "";


    askButton.disabled = true;


    const loadingId =
        addLoadingMessage();


    try {

        const response = await fetch(
            `${API_URL}/chat/`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    question: question
                })
            }
        );


        const data =
            await response.json();


        removeMessage(
            loadingId
        );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Chat request failed."
            );
        }


        addAssistantMessage(
            data.answer ||
            "No answer was returned.",
            data.sources || []
        );


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        removeMessage(
            loadingId
        );


        addAssistantMessage(
            "Sorry, I could not connect to the AI assistant. Please make sure the FastAPI backend is running."
        );


    } finally {

        askButton.disabled = false;

        questionInput.focus();
    }
}


// ============================================================
// REMOVE WELCOME MESSAGE
// ============================================================

function removeWelcomeMessage() {

    const welcome =
        document.querySelector(
            ".welcome-message"
        );


    if (welcome) {
        welcome.remove();
    }
}


// ============================================================
// USER MESSAGE
// ============================================================

function addUserMessage(message) {

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "chat-message user-message";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    content.textContent =
        message;


    messageElement.appendChild(
        content
    );


    chatMessages.appendChild(
        messageElement
    );


    scrollChatToBottom();
}


// ============================================================
// ASSISTANT MESSAGE
// ============================================================

function addAssistantMessage(
    message,
    sources = []
) {

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "chat-message assistant-message";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    content.textContent =
        message;


    messageElement.appendChild(
        content
    );


    const uniqueSources =
        getUniqueSources(sources);


    if (uniqueSources.length > 0) {

        const sourcesContainer =
            document.createElement("div");

        sourcesContainer.className =
            "sources-container";


        const sourceTitle =
            document.createElement("div");

        sourceTitle.className =
            "sources-title";

        sourceTitle.textContent =
            "Sources";


        sourcesContainer.appendChild(
            sourceTitle
        );


        uniqueSources.forEach(
            source => {

                const sourceChip =
                    document.createElement("div");

                sourceChip.className =
                    "source-chip";


                const filename =
                    document.createElement("span");

                filename.className =
                    "source-filename";

                filename.textContent =
                    source.filename ||
                    "Unknown document";


                const page =
                    document.createElement("span");

                page.className =
                    "source-page";

                page.textContent =
                    `Page ${source.page_number || "-"}`;


                sourceChip.appendChild(
                    filename
                );

                sourceChip.appendChild(
                    page
                );


                sourcesContainer.appendChild(
                    sourceChip
                );
            }
        );


        messageElement.appendChild(
            sourcesContainer
        );
    }


    chatMessages.appendChild(
        messageElement
    );


    scrollChatToBottom();
}


// ============================================================
// LOADING MESSAGE
// ============================================================

function addLoadingMessage() {

    const id =
        `loading-${Date.now()}`;


    const messageElement =
        document.createElement("div");

    messageElement.id = id;

    messageElement.className =
        "chat-message assistant-message loading-message";


    const content =
        document.createElement("div");

    content.className =
        "message-content";

    content.textContent =
        "AI is thinking...";


    messageElement.appendChild(
        content
    );


    chatMessages.appendChild(
        messageElement
    );


    scrollChatToBottom();


    return id;
}


// ============================================================
// REMOVE CHAT MESSAGE
// ============================================================

function removeMessage(id) {

    const element =
        document.getElementById(id);


    if (element) {
        element.remove();
    }
}


// ============================================================
// UNIQUE SOURCES
// ============================================================

function getUniqueSources(sources) {

    const unique = [];

    const seen = new Set();


    sources.forEach(source => {

        const key =
            `${source.document_id || ""}|` +
            `${source.filename || ""}|` +
            `${source.page_number || ""}`;


        if (!seen.has(key)) {

            seen.add(key);

            unique.push(source);
        }
    });


    return unique;
}


// ============================================================
// CHAT SCROLL
// ============================================================

function scrollChatToBottom() {

    if (!chatMessages) {
        return;
    }


    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ============================================================
// MOBILE MENU
// ============================================================

function setupMobileMenu() {

    if (!mobileMenuButton || !sidebar) {
        return;
    }


    mobileMenuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );
        }
    );


    const navItems =
        sidebar.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "open"
                    );
                }
            );
        }
    );
}