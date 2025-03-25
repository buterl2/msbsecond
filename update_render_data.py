import os
import requests
import json
import time
from datetime import datetime

# Configuration
RENDER_SERVICE_ID = "srv-cvaqp52n91rc7399nlk0"  # You'll get this from your Render dashboard
RENDER_API_KEY = "rnd_oJqivQNEBAUNnEAh023ZksFq6l2H"  # Generate this in Render account settings
DATA_DIR = "msb-dashboard/static/data"  # Path to your JSON data files

def deploy_to_render():
    """Trigger a manual deploy on Render to update the files"""
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {RENDER_API_KEY}"
    }
    url = f"https://api.render.com/v1/services/{RENDER_SERVICE_ID}/deploys"
    
    response = requests.post(url, headers=headers)
    if response.status_code == 201:
        print(f"Deployment triggered successfully at {datetime.now()}")
        return True
    else:
        print(f"Error triggering deployment: {response.status_code} - {response.text}")
        return False

# Call this after your SAP scripts finish updating the JSON files
if __name__ == "__main__":
    deploy_to_render()