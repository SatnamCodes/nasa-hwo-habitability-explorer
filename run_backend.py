#!/usr/bin/env python
"""Convenience launcher for the backend from repository root.

Usage:
  python run_backend.py  (adds backend to sys.path, runs uvicorn with reload)
"""
import uvicorn
import pathlib
import sys
import os

ROOT = pathlib.Path(__file__).parent.resolve()
BACKEND_DIR = ROOT / "backend"

if not BACKEND_DIR.exists():
    raise SystemExit("Backend directory not found")

sys.path.insert(0, str(BACKEND_DIR))
os.chdir(str(BACKEND_DIR))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
