# Habitability Reports (LaTeX)

This folder now contains LaTeX sources for:

1. Machine Learning Training Visual Report (`habitability_notebook_report.tex`).
2. Physics–Habitability Relations Report (`physics_relations_report.tex`).
3. Master Combined Report Scaffold (`final_project_report.tex`).
4. Build helper script (`build_pdf.ps1`).

## File Map
| File | Purpose |
|------|---------|
| `habitability_notebook_report.tex` | Explains ML training figures & metrics |
| `physics_relations_report.tex` | Explores physical feature relationships |
| `final_project_report.tex` | Master shell to merge both reports |
| `build_pdf.ps1` | Two-pass PDF build script with engine auto-detect |
| `../images/habitability/` | Figures from model training notebook |
| `../images/relations/` | Figures from physics relations notebook |

## Prerequisites
Install one LaTeX distribution:
- [MiKTeX](https://miktex.org/download) (Windows friendly)
- [TeX Live](https://www.tug.org/texlive/)

Ensure binaries (e.g. `pdflatex`, `xelatex`) are on `PATH`.

## 1. Export Figures First
Run the notebooks that generate figures:

### Training Notebook
```
data_science/notebooks/05_hwo_ml_model_training.ipynb
```
Exports to `docs/images/habitability/`.

### Relations Notebook
```
data_science/notebooks/06_physics_habitability_relations.ipynb
```
Exports to `docs/images/relations/` and writes `physics_relations_report.tex`.

## 2. Build Individual PDFs
From `docs/latex/`:
```powershell
# ML training report
./build_pdf.ps1 -File habitability_notebook_report.tex

# Physics relations report
./build_pdf.ps1 -File physics_relations_report.tex

# Clean auxiliary artifacts
./build_pdf.ps1 -Clean
```
Outputs: `habitability_notebook_report.pdf`, `physics_relations_report.pdf`.

## 3. Master Report Assembly
`final_project_report.tex` is a scaffold. To fully integrate both reports without duplicate preambles:
1. Extract body-only content from each source (everything between `\begin{document}` and `\end{document}`).
2. Save as:
	- `habitability_notebook_report_body.tex`
	- `physics_relations_report_body.tex`
3. Replace placeholder comments in `final_project_report.tex` with:
	```latex
	\input{habitability_notebook_report_body.tex}
	\input{physics_relations_report_body.tex}
	```
4. Build master:
	```powershell
	./build_pdf.ps1 -File final_project_report.tex
	```

### Optional Python Automation
```python
import re, pathlib
def extract_body(src, dst):
	 txt = pathlib.Path(src).read_text()
	 m = re.search(r"\\begin{document}(.*)\\end{document}", txt, re.S)
	 if not m: raise SystemExit(f"No body found in {src}")
	 pathlib.Path(dst).write_text(m.group(1).strip()+"\n")
extract_body('habitability_notebook_report.tex','habitability_notebook_report_body.tex')
extract_body('physics_relations_report.tex','physics_relations_report_body.tex')
```

## 4. Regenerating After Data / Model Changes
1. Re-run feature engineering & model notebook (05) → refresh model figures.
2. Re-run relations notebook (06) → refresh analytical figures & LaTeX.
3. Rebuild PDFs.
4. (Optional) Rebuild master after body extraction.

## 5. Adding New Figures
1. Ensure export code calls a `savefig()` utility before `plt.show()`.
2. Place output in the relevant folder (`habitability` or `relations`).
3. Add a `figure` environment referencing the PNG.
4. Rebuild the appropriate report.

## 6. Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| Engine not found | LaTeX not on PATH | Install MiKTeX / TeX Live & reopen shell |
| Missing figure warning | PNG not generated | Re-run notebook cell exporting figure |
| TOC incomplete | Single build pass | Run build again (script already does 2 passes) |
| Unicode errors | pdflatex limitations | Try `xelatex` via `./build_pdf.ps1 -File ...` (auto picks it if present) |
| Master preamble conflicts | Full docs embedded | Use body-only extraction workflow |
| Relations report empty | Notebook not executed | Run all cells in notebook 06 |

## 7. Continuous Integration (Suggested)
Add a CI job that:
1. Runs notebooks headless (e.g. `papermill`).
2. Commits updated figures + LaTeX.
3. Compiles PDFs; attaches as build artifacts.

## 8. License
See root `LICENSE` file for project licensing terms.

---
Maintained by the Habitability Explorer project.
