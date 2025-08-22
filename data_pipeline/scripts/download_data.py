import os
import pandas as pd
import requests

def download_nasa_data():
    print("📥 Downloading NASA Exoplanet data...")
    
    # Create datasets directory if it doesn't exist
    os.makedirs('c:/Programming/hwo-habitability-explorer/data_science/datasets', exist_ok=True)
    
    # NASA Exoplanet Archive API endpoint
    url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+ps&format=csv"
    
    try:
        # Download the data
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Save the raw data
        with open('c:/Programming/hwo-habitability-explorer/data_science/datasets/nasa_exoplanets.csv', 'w', encoding='utf-8') as f:
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
        os.system('C:/Users/satna/AppData/Local/Programs/Python/Python313/python.exe -m pip install requests')
    
    download_nasa_data()
