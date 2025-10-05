import os
import pandas as pd
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def download_nasa_data():
    print("📥 Downloading NASA Exoplanet data...")
    
    # Create datasets directory if it doesn't exist
    os.makedirs('../../data_science/datasets', exist_ok=True)
    
    # Get API key from environment
    api_key = os.getenv('NASA_API_KEY', 'DEMO_KEY')
    
    # NASA Exoplanet Archive API endpoint with API key
    url = f"https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+ps&format=csv&api_key={api_key}"
    
    try:
        # Download the data
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Save the raw data
        with open('../../data_science/datasets/nasa_exoplanets.csv', 'w', encoding='utf-8') as f:
            f.write(response.text)
            
        print("✅ NASA Exoplanet data downloaded successfully")
        
    except Exception as e:
        print(f"❌ Error downloading NASA data: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    # Install required packages if not present
    try:
        import requests
    except ImportError:
        print("Installing required packages...")
        os.system('python -m pip install requests')
    
    download_nasa_data()
