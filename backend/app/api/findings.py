from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
from typing import List, Dict, Any
import re
import time

router = APIRouter(prefix="/api/v1/findings", tags=["Findings"], )

BASE_DIR = Path(__file__).resolve().parents[2]  # project root
LATEX_DIR = BASE_DIR / "docs" / "latex"
ALLOWED_EXT = {".tex"}

_CACHE: Dict[str, Any] = {"timestamp": 0, "files": []}
_CACHE_TTL = 30  # seconds

TITLE_PATTERN = re.compile(r"\\title\{([^}]*)\}")
SECTION_PATTERN = re.compile(r"\\section\*?\{([^}]*)\}")


def _load_latex_files(refresh: bool = False) -> List[Dict[str, Any]]:
    now = time.time()
    if not refresh and _CACHE["files"] and (now - _CACHE["timestamp"]) < _CACHE_TTL:
        return _CACHE["files"]
    files: List[Dict[str, Any]] = []
    if not LATEX_DIR.exists():
        return []
    for tex in LATEX_DIR.glob("*.tex"):
        if tex.suffix not in ALLOWED_EXT:
            continue
        try:
            content = tex.read_text(encoding="utf-8", errors="ignore")
            title_match = TITLE_PATTERN.search(content)
            title = title_match.group(1).strip() if title_match else tex.name
            sections = SECTION_PATTERN.findall(content)
            files.append({
                "filename": tex.name,
                "title": title,
                "sections": sections,
                "size": tex.stat().st_size,
                "path": f"/static/latex/{tex.name}",
            })
        except Exception:
            # Skip problematic file
            continue
    _CACHE["files"] = files
    _CACHE["timestamp"] = now
    return files


@router.get("/list")
async def list_findings(refresh: bool = Query(False, description="Force refresh of cached LaTeX file metadata")):
    files = _load_latex_files(refresh=refresh)
    return {"count": len(files), "findings": files}


@router.get("/search")
async def search_findings(q: str = Query(..., min_length=2, description="Search query string (min length 2)"),
                          max_snippets: int = Query(5, ge=1, le=25)):
    files = _load_latex_files()
    if not files:
        raise HTTPException(status_code=404, detail="No LaTeX findings available")
    query = q.lower()
    results: List[Dict[str, Any]] = []
    for meta in files:
        tex_path = LATEX_DIR / meta["filename"]
        try:
            content = tex_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if query in content.lower():
            # Build snippets around matches
            snippets = []
            for match in re.finditer(re.escape(query), content, flags=re.IGNORECASE):
                start = max(0, match.start() - 120)
                end = min(len(content), match.end() + 120)
                snippet = content[start:end].replace('\n', ' ')
                snippets.append(snippet)
                if len(snippets) >= max_snippets:
                    break
            results.append({
                "filename": meta["filename"],
                "title": meta["title"],
                "snippets": snippets,
                "sections": meta.get("sections", []),
            })
    return {"query": q, "matches": len(results), "results": results}


@router.get("/raw/{filename}")
async def get_raw_finding(filename: str):
    if not filename.endswith('.tex'):
        raise HTTPException(status_code=400, detail="Only .tex files allowed")
    file_path = LATEX_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read file: {e}")
    return {"filename": filename, "content": content}
