"""
RAG Service - FAISS-based Retrieval Augmented Generation
Enables question-answering over documents using vector similarity search.
"""

import os
import numpy as np
from typing import Optional, List, Dict


class RAGPipeline:
    """
    RAG Pipeline using FAISS for vector similarity search
    and Gemini for answer generation.
    """
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.documents: Dict[str, List[str]] = {}  # doc_id -> chunks
        self.indices: Dict[str, any] = {}  # doc_id -> FAISS index
        self.embeddings: Dict[str, np.ndarray] = {}  # doc_id -> embedding matrix
        self._embedding_model = None
    
    def _load_embedding_model(self):
        """Load a lightweight embedding model."""
        if self._embedding_model is not None:
            return
        
        try:
            from sentence_transformers import SentenceTransformer
            # Use a small multilingual model
            self._embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            print("✅ Embedding model loaded for RAG")
        except Exception as e:
            print(f"⚠️ Error loading embedding model: {e}")
            self._embedding_model = None
    
    def _chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + self.chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append(chunk.strip())
            start = end - self.chunk_overlap
        return chunks
    
    def _get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Get embeddings for a list of texts."""
        self._load_embedding_model()
        
        if self._embedding_model is not None:
            return self._embedding_model.encode(texts, show_progress_bar=False)
        
        # Fallback: Simple TF-IDF-like embeddings
        # This is a very basic fallback - not ideal but works for demo
        dim = 384
        embeddings = np.random.randn(len(texts), dim).astype(np.float32)
        
        # Make somewhat meaningful by hashing words
        for i, text in enumerate(texts):
            words = text.lower().split()
            for word in words:
                idx = hash(word) % dim
                embeddings[i][idx] += 1.0
        
        # Normalize
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1
        embeddings = embeddings / norms
        
        return embeddings
    
    def add_document(self, doc_id: str, text: str):
        """
        Add a document to the RAG pipeline.
        Chunks the text and builds a FAISS index.
        """
        if doc_id in self.indices:
            return  # Already indexed
        
        # Chunk the text
        chunks = self._chunk_text(text)
        if not chunks:
            return
        
        self.documents[doc_id] = chunks
        
        # Get embeddings
        embeddings = self._get_embeddings(chunks)
        self.embeddings[doc_id] = embeddings
        
        # Build FAISS index
        try:
            import faiss
            
            dim = embeddings.shape[1]
            index = faiss.IndexFlatIP(dim)  # Inner product (cosine similarity after normalization)
            index.add(embeddings.astype(np.float32))
            self.indices[doc_id] = index
        except ImportError:
            print("⚠️ FAISS not installed. RAG will use simple similarity.")
            self.indices[doc_id] = None
    
    def query(self, question: str, doc_id: str, top_k: int = 3,
              history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Query the RAG pipeline with a question.
        Retrieves relevant chunks and generates an answer.
        """
        if doc_id not in self.documents:
            return "Document not found in the knowledge base."
        
        chunks = self.documents[doc_id]
        
        # Get relevant chunks
        relevant_chunks = self._retrieve(question, doc_id, top_k)
        
        if not relevant_chunks:
            relevant_chunks = chunks[:2]  # Fallback to first chunks
        
        # Combine context
        context = "\n\n".join(relevant_chunks)
        
        # Generate answer using the live AI API (Gemini / OpenAI-compatible)
        try:
            from services.llm_service import chat_with_document
            return chat_with_document(context, question, history=history)
        except Exception as e:
            # Fallback: Return relevant chunks as answer
            return f"Based on the document:\n\n{context[:1000]}"
    
    def _retrieve(self, question: str, doc_id: str, top_k: int = 3) -> List[str]:
        """Retrieve most relevant chunks for a question."""
        if doc_id not in self.documents:
            return []
        
        chunks = self.documents[doc_id]
        
        # Try FAISS retrieval
        if doc_id in self.indices and self.indices[doc_id] is not None:
            try:
                question_embedding = self._get_embeddings([question])
                index = self.indices[doc_id]
                
                # Search
                scores, indices = index.search(
                    question_embedding.astype(np.float32),
                    min(top_k, len(chunks))
                )
                
                relevant = [chunks[idx] for idx in indices[0] if idx < len(chunks)]
                return relevant
            except Exception as e:
                print(f"FAISS search error: {e}")
        
        # Fallback: Simple keyword matching
        question_words = set(question.lower().split())
        scored_chunks = []
        
        for i, chunk in enumerate(chunks):
            chunk_words = set(chunk.lower().split())
            overlap = len(question_words & chunk_words)
            scored_chunks.append((overlap, i))
        
        scored_chunks.sort(reverse=True)
        top_indices = [idx for _, idx in scored_chunks[:top_k]]
        
        return [chunks[idx] for idx in top_indices]
    
    def remove_document(self, doc_id: str):
        """Remove a document from the pipeline."""
        self.documents.pop(doc_id, None)
        self.indices.pop(doc_id, None)
        self.embeddings.pop(doc_id, None)
