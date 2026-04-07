import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv('.env')

api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    print("No GEMINI_API_KEY found in .env")
    exit(1)

genai.configure(api_key=api_key)

print("Available Models:")
try:
    models = list(genai.list_models())
    for m in models:
        print(f"- {m.name} (Methods: {m.supported_generation_methods})")
    print(f"Total models found: {len(models)}")
except Exception as e:
    print(f"Error listing models: {e}")
