import os
import google.generativeai as genai

try:
    from transformers import pipeline
    extractor_pipeline = pipeline("text-classification", model="nlpaueb/legal-bert-base-uncased", top_k=5)
except Exception as e:
    print(f"Warning: Legal-BERT pipeline could not be loaded: {e}")
    extractor_pipeline = None

def analyze_with_legal_bert(text):
    """
    Simulates extracting clauses with Legal-BERT.
    In a full production scenario matching >98% accuracy on CUAD, 
    this would be an extractive QA pipeline running over the entire text chunks.
    """
    preview = text[:512]
    if extractor_pipeline:
        results = extractor_pipeline(preview)
    else:
        results = [{"label": "mock_legal_topic", "score": 0.99}]
    return {"classified_topics": results, "extracted_text_preview": preview}

def generate_compliance_report(document_text):
    """
    Uses Gemini AI to parse the document text and generate structured outputs.
    Requires GEMINI_API_KEY environment variable.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY missing from environment variables.")
        
    genai.configure(api_key=api_key)
    # Using the standard gemini-pro model for text reasoning
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    You are an AI-powered compliance auditor specialized in legal business contracts.
    
    Analyze the following contract and provide a highly structured JSON report containing:
    1. 'parties': An array of objects detailing the parties involved (role, name, type, contact, email, phone, address).
    2. 'overall_score': A strict mathematical compliance score from 0 to 100. Start with a baseline of 100 points, then deduct 20 points for every 'High Risk' clause, 10 points for 'Medium Risk', 5 points for 'Low Risk', and 0 points for 'No Risk'.
    3. 'clauses': An array of objects for each major clause. Each clause should have:
        - 'title': Name of the clause
        - 'risk': Internally calculate the probability of the risk and its financial impact on the company. If it poses a high probability of significant financial loss, assign 'High Risk'. If moderate loss, 'Medium Risk'. If minor, 'Low Risk'. Otherwise, 'No Risk'.
        - 'status': 'Compliant', 'Minor Issue', 'Review Required', or 'Non-Compliant'
        - 'quote': The exact line(s) or paragraph from the contract where this clause was found.
        - 'explanation':  Reasoning why it received this score.
    4. 'summary': An overall text summary of the document and its implications.
    5. 'effective_date': The start date of the contract (YYYY-MM-DD).
    6. 'termination_date': The end date of the contract (YYYY-MM-DD).
    
    Contract Text:
    {document_text[:15000]} # Truncating to 15k chars for token limits
    """
    
    response = model.generate_content(prompt)
    
    raw_text = response.text
    try:
        import json
        clean_text = raw_text.replace('```json', '').replace('```', '').strip()
        data = json.loads(clean_text)
        
        if 'clauses' in data:
            score = 100
            for clause in data['clauses']:
                risk = clause.get('risk', '')
                if 'High' in risk:
                    score -= 20
                elif 'Medium' in risk:
                    score -= 10
                elif 'Low' in risk:
                    score -= 5
            # Ensure score is between 0 and 100
            data['overall_score'] = max(0, score)
            
            # Return proper JSON string
            return json.dumps(data, indent=2)
    except Exception as e:
        print(f"Failed to recalculate score: {e}")
        
    return raw_text
