# CX Maturity Framework

## Run Locally

The Vite frontend proxies `/api/*` calls to the FastAPI backend at `http://127.0.0.1:8000`.
Start both servers with:

```powershell
powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

If you prefer separate terminals:

```powershell
cd backend
python -m pip install -r requirements.txt
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

```powershell
cd frontend
npm.cmd run dev
```

If `/api/sectors` or `/sectors` shows `ECONNREFUSED 127.0.0.1:8000`, the frontend is running but the backend is not.
