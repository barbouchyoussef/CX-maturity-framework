# Backend

The frontend dev server proxies `/api/*` requests to `http://127.0.0.1:8000`.
Start the FastAPI backend before using the assessment form.

```powershell
cd backend
python -m pip install -r requirements.txt
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

If `python` is not available, install Python 3.11+ first, then rerun the commands.
