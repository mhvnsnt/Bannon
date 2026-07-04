# daemon_retrieval.py - High-Performance Local Context Retrieval
import os
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

class LocalContextCache:
    def __init__(self, workspace_dir="./public/library"):
        self.workspace_dir = os.path.abspath(workspace_dir)
        self.documents = []
        self.file_paths = []
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def index_entire_workspace(self):
        """Crawls MemFS and builds an in-memory statistical keyword index matrix."""
        self.documents = []
        self.file_paths = []
        
        if not os.path.exists(self.workspace_dir):
            return

        for root, _, files in os.walk(self.workspace_dir):
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js', '.rs', '.json')):
                    full_path = os.path.join(root, file)
                    try:
                        with open(full_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        self.documents.append(content)
                        self.file_paths.append(os.path.relpath(full_path, self.workspace_dir))
                    except Exception:
                        pass
        
        if self.documents:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.documents)
            print(f"[Retrieval Core] Successfully indexed {len(self.file_paths)} workspace files.")

    def search_relevant_context(self, user_query, max_results=3):
        """Extracts the exact code files matching semantic criteria via cosine similarity."""
        if not self.documents:
            return []
        
        query_vector = self.vectorizer.transform([user_query])
        similarity_scores = (self.tfidf_matrix * query_vector.T).toarray().flatten()
        top_indices = np.argsort(similarity_scores)[::-1][:max_results]
        
        matched_context = []
        for index in top_indices:
            if similarity_scores[index] > 0.05: # Strict match threshold
                matched_context.append({
                    "file": self.file_paths[index],
                    "snippet": self.documents[index][:2000] # Limit snippet token weight
                })
        return matched_context

if __name__ == "__main__":
    cache = LocalContextCache()
    cache.index_entire_workspace()
