import os

# Load .env before importing application modules
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import uvicorn
from mlblock.server.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
