import os
from groq import Groq
from typing import Dict

# Çevresel değişkenlerden API key'i al
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def generate_insights(events_summary: Dict) -> str:
    """
    Sistem verilerini LLaMA 3 modeline gönderir ve anlamlı analizler üretir.
    """
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        return "AI Insights kapalı. Analiz görmek için lütfen bir GROQ_API_KEY ekleyin."
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        # Yapay zekaya vereceğimiz İngilizce rol ve sistem komutu
        prompt = f"""
        You are a senior data scientist and system architect. 
        Below are the recent event statistics of a platform:
        
        {events_summary}
        
        Please analyze this data:
        1. Is there any anomaly, spike, or notable trend?
        2. What can you say about user behavior?
        3. What actions do you recommend to the development or product team?
        
        Provide a concise, clear, and professional response in English. Use Markdown with bullet points.
        """
        
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional, sharp, and analytical AI assistant."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.4,
        )
        return chat_completion.choices[0].message.content
        
    except Exception as e:
        return f"AI analizi sırasında bir hata oluştu: {str(e)}"