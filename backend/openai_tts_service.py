import os
import sys
import requests
import openai
from dotenv import load_dotenv
import wave
import re

# Load environment variables from .env file
load_dotenv()

# Set OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

def fetch_audio_from_openai(api_url, params, headers, file_path):
    try:
        response = requests.post(api_url, json=params, headers=headers, stream=True)
        print(f"Response status code: {response.status_code}")  # Log the status code

        response.raise_for_status()

        with wave.open(file_path, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 2 bytes for paInt16 format
            wf.setframerate(24000)
            
            for chunk in response.iter_content(chunk_size=4096):
                if chunk:
                    wf.writeframes(chunk)
        return {"status": "success", "message": f"Audio saved to {file_path}"}
    except Exception as e:
        print(f"Exception: {e}")  # Log the exception
        return {"status": "failure", "message": str(e)}

def remove_non_ascii(text):
    return re.sub(r'[^\x00-\x7F]+', '', text)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python openai_tts_service.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        with open(input_file, 'r', encoding='utf-8') as file:
            text = file.read()
        print(f"Text read from file: {text[:100]}...")  # Log the beginning of the text
    except Exception as e:
        print(f"Failed to read the input file: {e}")
        sys.exit(1)

    text = remove_non_ascii(text)  # Remove non-ASCII characters
    if len(text) > 4096:
        text = text[:4096]  # Truncate the text to fit the API limit

    params = {
        "model": "tts-1",
        "voice": "alloy",
        "input": text,
        "response_format": "pcm"
    }

    headers = {
        "Authorization": f"Bearer {openai.api_key}",
        "Content-Type": "application/json"
    }

    print(f"Sending request with params: {params}")  # Log the request parameters
    result = fetch_audio_from_openai("https://api.openai.com/v1/audio/speech", params, headers, output_file)

    if result["status"] == "success":
        print(result["message"])
    else:
        print(f"Error: {result['message']}")
        sys.exit(1)
