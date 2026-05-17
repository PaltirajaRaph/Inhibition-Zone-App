from __future__ import annotations

import os
from typing import Literal

import cv2
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from pipeline import HomographyResult, process_image_bytes


app = FastAPI(title="Homography Service", version="1.0")

# Allow calls from the phone app (Capacitor/WebView) and from dev browsers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


def _encode_image(rgb, fmt: Literal["jpg", "jpeg", "png"]) -> tuple[bytes, str]:
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    if fmt in ("jpg", "jpeg"):
        ext = ".jpg"
        media_type = "image/jpeg"
        params = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    else:
        ext = ".png"
        media_type = "image/png"
        params = [int(cv2.IMWRITE_PNG_COMPRESSION), 3]

    ok, encoded = cv2.imencode(ext, bgr, params)
    if not ok:
        raise ValueError("Failed to encode output image")

    return encoded.tobytes(), media_type


@app.post("/homography")
async def homography(
    file: UploadFile = File(...),
    format: Literal["jpg", "jpeg", "png"] = "jpg",
):
    if not file:
        raise HTTPException(status_code=400, detail="Missing file")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty upload")

    try:
        result: HomographyResult = process_image_bytes(data)
    except Exception as exc:  # keep details off the client
        raise HTTPException(status_code=400, detail=f"Homography failed: {type(exc).__name__}") from exc

    if result.image_rgb is None:
        raise HTTPException(status_code=400, detail="Homography produced no output")

    try:
        payload, media_type = _encode_image(result.image_rgb, format)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to encode output") from exc

    headers = {
        "x-homography-ok": "1" if result.ok else "0",
        "x-homography-reasons": ";".join(result.reasons)[:800],
        "cache-control": "no-store",
    }

    return Response(content=payload, media_type=media_type, headers=headers)


if __name__ == "__main__":
    # For local runs: python server.py
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
