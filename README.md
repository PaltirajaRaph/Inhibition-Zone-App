# Inhibition Zone App

Antimicrobial susceptibility analysis platform with Android-first frontend, computer-vision preprocessing, YOLO-based measurement, and API-backed reporting.

## Project Layout

- `App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard`: React + Capacitor app (Android target), scripts, database SQL, PHP API source.
- `App tugas akhir/App tugas akhir/homography`: FastAPI service for image rectification and glare handling.
- `App tugas akhir/App tugas akhir/yolo_service`: FastAPI service for YOLO inference and inhibition-zone measurement.
- `App tugas akhir/App tugas akhir/YOLO AI`: model assets and dataset config used by inference service.
- `external/yolov9`: upstream YOLOv9 codebase used by the local inference service.
- `RUN_FROM_START.md`: full Windows setup and operational runbook.
- `model_comparison_yolov7_yolov9.ipynb`: model comparison notebook and metric analysis.

## Quick Start

1. Read the full setup guide in `RUN_FROM_START.md`.
2. Install dependencies and tools listed there (Git LFS, Node, Python 3.10, XAMPP, Android Studio, ngrok).
3. Configure `.env` in the app folder.
4. Start services and run Android workflow from the app folder.

## Detailed Guides

- Full setup and troubleshooting: `RUN_FROM_START.md`
- App-focused commands and scripts: `App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/README.md`
- Database setup notes: `App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/README_DATABASE.md`

## Notes

- YOLO model files are tracked with Git LFS. After cloning, run `git lfs pull`.
- For deployment using free ngrok, use the gateway path strategy documented in `RUN_FROM_START.md`.
