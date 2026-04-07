import os
import weaviate
from weaviate.classes.config import Configure, Property, DataType
import weaviate.classes as wvc

def get_weaviate_client():
    """
    Initializes and returns the Weaviate Client.
    Uses WEAVIATE_URL and WEAVIATE_API_KEY if configured for WCS,
    Otherwise attempts local connection.
    """
    api_key = os.getenv("WEAVIATE_API_KEY")
    url = os.getenv("WEAVIATE_URL")
    
    if api_key and url:
        client = weaviate.connect_to_wcs(
            cluster_url=url,
            auth_credentials=weaviate.auth.AuthApiKey(api_key)
        )
    else:
        # Fallback to local Docker setup if cloud keys aren't provided
        client = weaviate.connect_to_local()
    return client

def init_weaviate_schema(client):
    """
    Sets up the collection schema for storing contract chunks.
    """
    collection_name = "ContractDocument"
    
    if not client.collections.exists(collection_name):
        client.collections.create(
            name=collection_name,
            properties=[
                Property(name="filename", data_type=DataType.TEXT),
                Property(name="chunk_text", data_type=DataType.TEXT),
                Property(name="chunk_index", data_type=DataType.INT),
            ],
            # Use default vectorizer
            vectorizer_config=Configure.Vectorizer.text2vec_huggingface()
        )
    return client.collections.get(collection_name)

def store_document_chunks(client, filename, text):
    """
    Chunks the document text and stores it in Weaviate.
    """
    collection = init_weaviate_schema(client)
    
    # Simple chunking logic (could be improved using Langchain text splitters)
    chunk_size = 1000
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    with collection.batch.dynamic() as batch:
        for i, chunk in enumerate(chunks):
            batch.add_object({
                "filename": filename,
                "chunk_text": chunk,
                "chunk_index": i
            })
            
    return len(chunks)
