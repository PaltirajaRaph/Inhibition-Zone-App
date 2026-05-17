from __future__ import annotations

import base64
from dataclasses import dataclass
from pathlib import Path
import sys
from typing import Any

import cv2
import numpy as np
import torch

YOLO_ROOT = Path(__file__).resolve().parents[3] / "external" / "yolov9"
if str(YOLO_ROOT) not in sys.path:
    sys.path.append(str(YOLO_ROOT))

from models.common import DetectMultiBackend
from utils.augmentations import letterbox
from utils.general import check_img_size, non_max_suppression, scale_boxes
from utils.torch_utils import select_device


@dataclass
class Detection:
    label: str
    confidence: float
    box: dict[str, float]


@dataclass
class ZoneMeasurement:
    index: int
    label: str
    result: str | None
    diameter_mm: float | None
    disk_diameter_px: float | None
    zone_diameter_px: float | None
    scale_mm_per_px: float | None
    disk_confidence: float | None
    zone_confidence: float | None
    disk_box: dict[str, float] | None
    zone_box: dict[str, float] | None


@dataclass
class YoloResult:
    detections: list[Detection]
    measurements: list[ZoneMeasurement]
    processed_image_bgr: np.ndarray | None
    zone_diameter_px: float | None
    disk_diameter_px: float | None
    zone_diameter_mm: float | None
    scale_mm_per_px: float | None
    zone_confidence: float | None


def encode_image_bgr_to_data_url(image_bgr: np.ndarray, fmt: str = "jpg") -> str:
    ext = ".jpg" if fmt.lower() in {"jpg", "jpeg"} else ".png"
    media_type = "image/jpeg" if ext == ".jpg" else "image/png"
    ok, encoded = cv2.imencode(ext, image_bgr)
    if not ok:
        raise ValueError("Failed to encode YOLO result image")
    payload = base64.b64encode(encoded.tobytes()).decode("ascii")
    return f"data:{media_type};base64,{payload}"


class YoloAnalyzer:
    MIN_ZONE_TO_DISK_RATIO = 1.12
    MAX_ZONE_TO_DISK_RATIO = 7.5
    MAX_ZONE_CENTER_OFFSET_RATIO = 0.5

    def __init__(
        self,
        weights: Path,
        data: Path,
        disk_diameter_mm: float = 6.0,
        img_size: int = 640,
        conf_thres: float = 0.25,
        iou_thres: float = 0.45,
        device: str = "",
    ) -> None:
        self.disk_diameter_mm = float(disk_diameter_mm)
        self.conf_thres = float(conf_thres)
        self.iou_thres = float(iou_thres)
        self.cuda_available = bool(torch.cuda.is_available())
        self.device = select_device(device)
        self.model = DetectMultiBackend(str(weights), device=self.device, data=str(data), fp16=False)
        self.stride = int(self.model.stride)
        self.img_size = check_img_size(img_size, s=self.stride)
        self.names = self.model.names

    def _class_name(self, cls_id: int) -> str:
        if isinstance(self.names, dict):
            return str(self.names.get(int(cls_id), cls_id))
        if isinstance(self.names, list) and 0 <= int(cls_id) < len(self.names):
            return str(self.names[int(cls_id)])
        return str(cls_id)

    def _draw_detections(
        self,
        image_bgr: np.ndarray,
        detections: list[Detection],
        measurements: list[ZoneMeasurement] | None = None,
        allowed_zone_boxes: list[dict[str, float]] | None = None,
    ) -> np.ndarray:
        output = image_bgr.copy()
        selected_zone_boxes = {
            self._box_signature(measurement.zone_box)
            for measurement in measurements or []
            if measurement.zone_box
        }
        allowed_zone_signatures = (
            {self._box_signature(box) for box in allowed_zone_boxes}
            if allowed_zone_boxes is not None
            else None
        )

        for det in detections:
            box = det.box
            x1 = int(round(box["x1"]))
            y1 = int(round(box["y1"]))
            x2 = int(round(box["x2"]))
            y2 = int(round(box["y2"]))
            label = det.label.lower()
            if "inhibition" in label:
                signature = self._box_signature(box)
                if selected_zone_boxes and signature not in selected_zone_boxes:
                    continue
                if not selected_zone_boxes and allowed_zone_signatures is not None and signature not in allowed_zone_signatures:
                    continue
                color = (0, 200, 0)
            elif "disk" in label:
                color = (255, 90, 0)
            else:
                color = (0, 120, 255)

            cv2.rectangle(output, (x1, y1), (x2, y2), color, 2)
            caption = f"{det.label} {det.confidence:.2f}"
            cv2.putText(
                output,
                caption,
                (x1, max(12, y1 - 6)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                1,
                cv2.LINE_AA,
            )

        for measurement in measurements or []:
            box = measurement.disk_box or measurement.zone_box
            if not box:
                continue

            badge = str(measurement.index)
            font_scale = 0.82
            thickness = 2
            (text_width, text_height), baseline = cv2.getTextSize(
                badge,
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                thickness,
            )
            badge_radius = max(20, int(max(text_width, text_height + baseline) / 2) + 8)

            x1 = int(round(box["x1"]))
            y1 = int(round(box["y1"]))
            x2 = int(round(box["x2"]))
            cx = min(output.shape[1] - badge_radius - 3, max(badge_radius + 3, x2 + badge_radius + 4))
            cy = max(badge_radius + 3, y1 - badge_radius - 4)

            if x2 + (badge_radius * 2) + 8 >= output.shape[1]:
                cx = max(badge_radius + 3, x1 - badge_radius - 4)

            text_x = int(cx - text_width / 2)
            text_y = int(cy + text_height / 2)

            cv2.circle(output, (cx, cy), badge_radius, (255, 255, 255), -1)
            cv2.circle(output, (cx, cy), badge_radius, (20, 120, 255), 3)
            cv2.putText(
                output,
                badge,
                (text_x, text_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                (20, 80, 220),
                thickness,
                cv2.LINE_AA,
            )
        return output

    @staticmethod
    def _distance_between_boxes(first_box: dict[str, float], second_box: dict[str, float]) -> float:
        dx = float(first_box["cx"] - second_box["cx"])
        dy = float(first_box["cy"] - second_box["cy"])
        return float((dx * dx + dy * dy) ** 0.5)

    @staticmethod
    def _box_signature(box: dict[str, float]) -> tuple[float, float, float, float]:
        return (
            round(float(box["x1"]), 3),
            round(float(box["y1"]), 3),
            round(float(box["x2"]), 3),
            round(float(box["y2"]), 3),
        )

    @staticmethod
    def _center_in_box(center_box: dict[str, float], container_box: dict[str, float]) -> bool:
        return (
            container_box["x1"] <= center_box["cx"] <= container_box["x2"]
            and container_box["y1"] <= center_box["cy"] <= container_box["y2"]
        )

    @staticmethod
    def _sample_label(index: int) -> str:
        return f"Sample {max(1, int(index) + 1)}"

    def _zone_match_score(self, disk: dict[str, Any], zone: dict[str, Any]) -> tuple[float, float, float] | None:
        disk_diameter = float(disk["diameter_px"])
        zone_diameter = float(zone["diameter_px"])
        if disk_diameter <= 0 or zone_diameter <= 0:
            return None

        zone_to_disk_ratio = zone_diameter / disk_diameter
        if zone_to_disk_ratio < self.MIN_ZONE_TO_DISK_RATIO:
            return None
        if zone_to_disk_ratio > self.MAX_ZONE_TO_DISK_RATIO:
            return None

        disk_box = disk["det"].box
        zone_box = zone["det"].box
        distance = self._distance_between_boxes(disk_box, zone_box)
        disk_radius = disk_diameter / 2.0
        zone_radius = zone_diameter / 2.0

        if not self._center_in_box(disk_box, zone_box):
            return None
        if distance > max(zone_radius * self.MAX_ZONE_CENTER_OFFSET_RATIO, disk_radius * 0.75):
            return None
        if distance + disk_radius > zone_radius * 1.12:
            return None

        center_offset = distance / max(zone_radius, 1.0)
        return (center_offset, -zone_to_disk_ratio, -float(zone["conf"]))

    def _build_measurements(
        self,
        disk_candidates: list[dict[str, Any]],
        zone_candidates: list[dict[str, Any]],
        disk_mm: float,
    ) -> list[ZoneMeasurement]:
        measurements: list[ZoneMeasurement] = []
        if not disk_candidates:
            return measurements

        used_zone_indexes: set[int] = set()
        sorted_disks = sorted(
            disk_candidates,
            key=lambda item: (item["det"].box["cy"], item["det"].box["cx"]),
        )

        for disk in sorted_disks:
            choices: list[tuple[float, float, float, int, dict[str, Any]]] = []
            disk_box = disk["det"].box

            for zone_index, zone in enumerate(zone_candidates):
                if zone_index in used_zone_indexes:
                    continue

                score = self._zone_match_score(disk, zone)
                if score is None:
                    continue
                choices.append((*score, zone_index, zone))

            disk_diameter_px = float(disk["diameter_px"])
            scale_mm_per_px = float(disk_mm / disk_diameter_px) if disk_diameter_px > 0 else None

            selected_zone = None
            if choices:
                _, _, _, selected_zone_index, selected_zone = min(choices, key=lambda item: (item[0], item[1], item[2]))
                used_zone_indexes.add(selected_zone_index)

            zone_diameter_px = float(selected_zone["diameter_px"]) if selected_zone else disk_diameter_px
            diameter_mm = float(zone_diameter_px * scale_mm_per_px) if scale_mm_per_px else None

            measurements.append(
                ZoneMeasurement(
                    index=len(measurements) + 1,
                    label=self._sample_label(len(measurements)),
                    result=None if selected_zone else "RESISTEN",
                    diameter_mm=diameter_mm,
                    disk_diameter_px=disk_diameter_px,
                    zone_diameter_px=zone_diameter_px,
                    scale_mm_per_px=scale_mm_per_px,
                    disk_confidence=float(disk["conf"]),
                    zone_confidence=float(selected_zone["conf"]) if selected_zone else None,
                    disk_box=disk_box,
                    zone_box=selected_zone["det"].box if selected_zone else None,
                )
            )

        return measurements

    def analyze(self, image_bgr: np.ndarray, disk_diameter_mm: float | None = None) -> YoloResult:
        if image_bgr is None or image_bgr.size == 0:
            raise ValueError("Empty image input")

        disk_mm = float(disk_diameter_mm) if disk_diameter_mm else self.disk_diameter_mm
        im0 = image_bgr.copy()
        im = letterbox(im0, self.img_size, stride=self.stride, auto=True)[0]
        im = im.transpose((2, 0, 1))[::-1]
        im = np.ascontiguousarray(im)

        tensor = torch.from_numpy(im).to(self.device)
        tensor = tensor.float()
        tensor /= 255.0
        if tensor.ndim == 3:
            tensor = tensor[None]

        with torch.no_grad():
            pred = self.model(tensor)
            pred = non_max_suppression(pred, self.conf_thres, self.iou_thres, max_det=300)

        detections: list[Detection] = []
        disk_candidates: list[dict[str, Any]] = []
        zone_candidates: list[dict[str, Any]] = []

        det = pred[0] if pred else None
        if det is not None and len(det) > 0:
            det[:, :4] = scale_boxes(tensor.shape[2:], det[:, :4], im0.shape).round()
            for row in det.tolist():
                x1, y1, x2, y2, conf, cls_id = row
                w = max(0.0, x2 - x1)
                h = max(0.0, y2 - y1)
                diameter_px = float((w + h) / 2.0)
                label = self._class_name(int(cls_id))
                detection = Detection(
                    label=label,
                    confidence=float(conf),
                    box={
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2),
                        "width": float(w),
                        "height": float(h),
                        "cx": float(x1 + w / 2.0),
                        "cy": float(y1 + h / 2.0),
                    },
                )
                detections.append(detection)

                label_lower = label.lower()
                if "disk" in label_lower:
                    disk_candidates.append({"det": detection, "diameter_px": diameter_px, "area": w * h, "conf": float(conf)})
                elif "inhibition" in label_lower:
                    zone_candidates.append({"det": detection, "diameter_px": diameter_px, "area": w * h, "conf": float(conf)})

        measurements = self._build_measurements(disk_candidates, zone_candidates, disk_mm)

        disk_diameter_px = None
        zone_diameter_px = None
        zone_confidence = None

        if measurements:
            primary_measurement = measurements[0]
            disk_diameter_px = primary_measurement.disk_diameter_px
            zone_diameter_px = primary_measurement.zone_diameter_px
            zone_confidence = primary_measurement.zone_confidence
        else:
            if disk_candidates:
                disk_diameter_px = float(max(disk_candidates, key=lambda item: item["area"])["diameter_px"])
            elif zone_candidates:
                best_zone = max(zone_candidates, key=lambda item: item["area"])
                zone_diameter_px = float(best_zone["diameter_px"])
                zone_confidence = float(best_zone["conf"])

        scale_mm_per_px = None
        zone_diameter_mm = None
        if disk_diameter_px and disk_diameter_px > 0:
            scale_mm_per_px = float(disk_mm / disk_diameter_px)
        if zone_diameter_px and scale_mm_per_px:
            zone_diameter_mm = float(zone_diameter_px * scale_mm_per_px)

        allowed_zone_boxes = None
        if measurements:
            allowed_zone_boxes = [measurement.zone_box for measurement in measurements if measurement.zone_box]
        elif disk_candidates:
            allowed_zone_boxes = []

        processed_image = self._draw_detections(im0, detections, measurements, allowed_zone_boxes) if detections else im0

        return YoloResult(
            detections=detections,
            measurements=measurements,
            processed_image_bgr=processed_image,
            zone_diameter_px=zone_diameter_px,
            disk_diameter_px=disk_diameter_px,
            zone_diameter_mm=zone_diameter_mm,
            scale_mm_per_px=scale_mm_per_px,
            zone_confidence=zone_confidence,
        )
