from __future__ import annotations

import os
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from yolo_inference import YoloAnalyzer, encode_image_bgr_to_data_url


app = FastAPI(title="YOLOv9 Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_WEIGHTS = BASE_DIR.parent / "YOLO AI" / "best.pt"
DEFAULT_DATA = BASE_DIR.parent / "YOLO AI" / "antibiogram.yaml"

WEIGHTS_PATH = Path(os.environ.get("YOLO_WEIGHTS", str(DEFAULT_WEIGHTS)))
DATA_PATH = Path(os.environ.get("YOLO_DATA", str(DEFAULT_DATA)))
DEFAULT_DISK_MM = float(os.environ.get("YOLO_DISK_DIAMETER_MM", "6"))

analyzer = YoloAnalyzer(
    weights=WEIGHTS_PATH,
    data=DATA_PATH,
    disk_diameter_mm=DEFAULT_DISK_MM,
)


@app.get("/health")
def health():
    return {
        "ok": True,
        "weights": str(WEIGHTS_PATH),
        "data": str(DATA_PATH),
    }


@app.post("/yolo/analyze")
async def yolo_analyze(
    file: UploadFile = File(...),
    disk_mm: float | None = Form(None),
):
    if not file:
        raise HTTPException(status_code=400, detail="Missing file")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty upload")

    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    try:
        result = analyzer.analyze(image, disk_diameter_mm=disk_mm)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YOLO inference failed: {type(exc).__name__}") from exc

    processed_image = encode_image_bgr_to_data_url(result.processed_image_bgr) if result.processed_image_bgr is not None else None

    return {
        "success": True,
        "data": {
            "processedImage": processed_image,
            "diameterMm": result.zone_diameter_mm,
            "diskDiameterPx": result.disk_diameter_px,
            "zoneDiameterPx": result.zone_diameter_px,
            "scaleMmPerPx": result.scale_mm_per_px,
            "zoneConfidence": result.zone_confidence,
            "measurements": [
                {
                    "index": measurement.index,
                    "label": measurement.label,
                    "result": measurement.result,
                    "diameterMm": measurement.diameter_mm,
                    "diskDiameterPx": measurement.disk_diameter_px,
                    "zoneDiameterPx": measurement.zone_diameter_px,
                    "scaleMmPerPx": measurement.scale_mm_per_px,
                    "diskConfidence": measurement.disk_confidence,
                    "zoneConfidence": measurement.zone_confidence,
                    "diskBox": measurement.disk_box,
                    "zoneBox": measurement.zone_box,
                }
                for measurement in result.measurements
            ],
            "detections": [
                {
                    "label": det.label,
                    "confidence": det.confidence,
                    "box": det.box,
                }
                for det in result.detections
            ],
        },
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "9000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
