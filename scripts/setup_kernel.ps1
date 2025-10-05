Param(
    [string]$KernelName = "hwo-py3",
    [string]$DisplayName = "HWO Python 3"
)

Write-Host "[HWO] Using py -3 to ensure Python launcher version" -ForegroundColor Cyan
if (-not (Test-Path .venv)) {
    Write-Host "[HWO] Creating virtual environment (.venv)" -ForegroundColor Cyan
    py -3 -m venv .venv
}

Write-Host "[HWO] Activating virtual environment" -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1

Write-Host "[HWO] Installing ipykernel (quiet)" -ForegroundColor Cyan
py -3 -m pip install --upgrade pip --quiet
py -3 -m pip install ipykernel --quiet

Write-Host "[HWO] Registering kernel $KernelName" -ForegroundColor Cyan
py -3 -m ipykernel install --user --name $KernelName --display-name "$DisplayName" | Out-Null

Write-Host "[HWO] Kernel '$KernelName' registered. Select it in VS Code Notebook Kernel picker." -ForegroundColor Green