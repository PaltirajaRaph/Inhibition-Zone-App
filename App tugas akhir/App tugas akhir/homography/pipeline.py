from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class HomographyResult:
    image_rgb: np.ndarray | None
    ok: bool
    reasons: list[str]


def decode_image_bytes_to_rgb(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Unable to decode image")
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def resize_rgb(img_rgb: np.ndarray, max_side: int = 1600) -> np.ndarray:
    h, w = img_rgb.shape[:2]
    if h <= 0 or w <= 0:
        raise ValueError("Invalid image")

    scale = min(1.0, float(max_side) / float(max(h, w)))
    if scale < 1.0:
        new_w = max(1, int(round(w * scale)))
        new_h = max(1, int(round(h * scale)))
        img_rgb = cv2.resize(img_rgb, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return img_rgb


def polarization_filter_remove_reflection(img_rgb: np.ndarray, max_mask_frac: float = 0.02):
    if img_rgb is None:
        return img_rgb, None

    h, w = img_rgb.shape[:2]
    if h == 0 or w == 0:
        return img_rgb, None

    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    H, S, V = cv2.split(hsv)

    r = img_rgb[:, :, 0]
    g = img_rgb[:, :, 1]
    b = img_rgb[:, :, 2]
    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    chroma = (maxc.astype(np.int16) - minc.astype(np.int16)).astype(np.int16)

    sigma = float(max(3.0, 0.02 * min(h, w)))
    V_blur = cv2.GaussianBlur(V, (0, 0), sigmaX=sigma, sigmaY=sigma)
    V_excess = V.astype(np.int16) - V_blur.astype(np.int16)

    s_thr = 90
    chroma_thr = 45

    v_thr_candidates = [
        int(max(235, np.percentile(V, 99.7))),
        int(max(240, np.percentile(V, 99.85))),
        int(max(245, np.percentile(V, 99.95))),
    ]
    ex_thr_candidates = [
        int(max(10, np.percentile(V_excess, 99.7))),
        int(max(14, np.percentile(V_excess, 99.85))),
        int(max(18, np.percentile(V_excess, 99.95))),
    ]

    v_thr_candidates = sorted(set(min(255, max(0, v)) for v in v_thr_candidates))
    ex_thr_candidates = sorted(set(int(v) for v in ex_thr_candidates))

    chosen_mask = None
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))

    for v_thr, ex_thr in zip(v_thr_candidates, ex_thr_candidates):
        mask = (
            (V >= v_thr)
            & (S <= s_thr)
            & (chroma <= chroma_thr)
            & (V_excess >= ex_thr)
        ).astype(np.uint8) * 255

        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k, iterations=1)
        mask = cv2.dilate(mask, k, iterations=1)

        frac = float(np.count_nonzero(mask)) / float(h * w)
        if 0.0 < frac <= max_mask_frac:
            chosen_mask = mask
            break

    if chosen_mask is None:
        chosen_mask = np.zeros((h, w), dtype=np.uint8)

    if np.count_nonzero(chosen_mask) == 0:
        return img_rgb, chosen_mask

    num, labels, stats, _ = cv2.connectedComponentsWithStats(chosen_mask, connectivity=8)
    if num > 1:
        max_area = int(round(0.08 * h * w))
        min_area = 12

        keep = np.zeros(num, dtype=np.uint8)
        for i in range(1, num):
            a = int(stats[i, cv2.CC_STAT_AREA])
            if min_area <= a <= max_area:
                keep[i] = 1

        mask_f = (keep[labels] * 255).astype(np.uint8)
    else:
        mask_f = chosen_mask

    if np.count_nonzero(mask_f) == 0:
        return img_rgb, mask_f

    clamp_margin = 12
    V_target = np.minimum(V.astype(np.int16), V_blur.astype(np.int16) + clamp_margin)
    V_target = V_target.clip(0, 255).astype(np.uint8)

    V2 = V.copy()
    V2[mask_f > 0] = V_target[mask_f > 0]

    hsv2 = cv2.merge([H, S, V2])
    rgb_fix = cv2.cvtColor(hsv2, cv2.COLOR_HSV2RGB)
    return rgb_fix, mask_f


def bilateral_unsharp(
    img_rgb: np.ndarray,
    d: int = 9,
    sigma_color: int = 60,
    sigma_space: int = 9,
    amount: float = 0.6,
    radius: float = 5,
):
    smooth = cv2.bilateralFilter(img_rgb, d=d, sigmaColor=sigma_color, sigmaSpace=sigma_space)
    blur = cv2.GaussianBlur(smooth, (0, 0), sigmaX=float(radius), sigmaY=float(radius))
    sharp = cv2.addWeighted(smooth, 1.0 + float(amount), blur, -float(amount), 0.0)
    sharp = np.clip(sharp, 0, 255).astype(np.uint8)
    return smooth, sharp


def detect_glare_mask(img_rgb: np.ndarray, max_mask_frac: float = 0.03):
    h, w = img_rgb.shape[:2]
    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    _, S, V = cv2.split(hsv)

    sigma = float(max(3.0, 0.02 * min(h, w)))
    V_blur = cv2.GaussianBlur(V, (0, 0), sigmaX=sigma, sigmaY=sigma)
    V_excess = V.astype(np.int16) - V_blur.astype(np.int16)

    v_thr = int(max(235, np.percentile(V, 99.5)))
    ex_thr = int(max(10, np.percentile(V_excess, 99.5)))
    mask = ((V >= v_thr) & (S <= 90) & (V_excess >= ex_thr)).astype(np.uint8) * 255

    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k, iterations=1)
    mask = cv2.dilate(mask, k, iterations=2)

    frac = float(np.count_nonzero(mask)) / float(h * w)
    if frac > max_mask_frac:
        mask = cv2.erode(mask, k, iterations=1)

    return mask


def inpaint_glare(img_rgb: np.ndarray, mask: np.ndarray | None, radius: int = 7):
    if mask is None or np.count_nonzero(mask) == 0:
        return img_rgb.copy()
    bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    out_bgr = cv2.inpaint(bgr, mask, inpaintRadius=int(radius), flags=cv2.INPAINT_TELEA)
    return cv2.cvtColor(out_bgr, cv2.COLOR_BGR2RGB)


def laplacian_var(img_rgb: np.ndarray) -> float:
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def laplacian_var_mask(img_rgb: np.ndarray, mask: np.ndarray) -> float:
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    m = mask > 0
    if int(np.count_nonzero(m)) < 64:
        return float(lap.var())
    return float(np.var(lap[m]))


def mild_unsharp_luma(img_rgb: np.ndarray, amount: float = 0.25, sigma: float = 1.0):
    lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    l_blur = cv2.GaussianBlur(l, (0, 0), sigmaX=float(sigma), sigmaY=float(sigma))
    l_sharp = cv2.addWeighted(l, 1.0 + float(amount), l_blur, -float(amount), 0.0)
    l_sharp = np.clip(l_sharp, 0, 255).astype(np.uint8)
    out = cv2.cvtColor(cv2.merge([l_sharp, a, b]), cv2.COLOR_LAB2RGB)
    return out


def lab_color_shift(ref_rgb: np.ndarray, out_rgb: np.ndarray, mask: np.ndarray | None = None):
    ref_lab = cv2.cvtColor(ref_rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    out_lab = cv2.cvtColor(out_rgb, cv2.COLOR_RGB2LAB).astype(np.float32)

    if mask is None:
        m = np.ones(ref_lab.shape[:2], dtype=bool)
    else:
        m = mask > 0
        if int(np.count_nonzero(m)) < 64:
            m = np.ones(ref_lab.shape[:2], dtype=bool)

    d = np.abs(out_lab[m] - ref_lab[m])
    d_ab = np.mean(d[:, 1:3]) if d.shape[0] > 0 else 0.0
    d_all = np.mean(d) if d.shape[0] > 0 else 0.0
    return float(d_ab), float(d_all)


def normalize_ellipse(e):
    (cx, cy), (d1, d2), ang = e
    if d1 < d2:
        d1, d2 = d2, d1
        ang = (ang + 90.0) % 180.0
    return ((float(cx), float(cy)), (float(d1), float(d2)), float(ang))


def seed_is_plausible(seed_ellipse, shape_hw) -> bool:
    if seed_ellipse is None:
        return False
    h, w = shape_hw
    min_hw = float(min(h, w))
    (cx, cy), (maj, minr), _ = seed_ellipse
    if maj <= 1e-6 or minr <= 1e-6:
        return False
    if not (0.18 * min_hw <= maj <= 1.05 * min_hw):
        return False
    if not (0.15 * min_hw <= minr <= 1.05 * min_hw):
        return False
    if not (0 <= cx < w and 0 <= cy < h):
        return False
    return True


def estimate_seed_ellipse(img_rgb: np.ndarray):
    h, w = img_rgb.shape[:2]
    min_hw = float(min(h, w))

    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (7, 7), 0)

    cands = []

    circles = cv2.HoughCircles(
        blur,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=0.35 * min_hw,
        param1=120,
        param2=28,
        minRadius=int(0.16 * min_hw),
        maxRadius=int(0.62 * min_hw),
    )
    if circles is not None and len(circles[0]) > 0:
        for x, y, r in circles[0]:
            if r <= 1:
                continue
            dist = float(np.hypot(x - (w / 2.0), y - (h / 2.0))) / max(min_hw, 1.0)
            score = (1.8 * (r / max(min_hw, 1.0))) - (1.2 * dist)
            cands.append((score, ((float(x), float(y)), (float(2 * r), float(2 * r)), 0.0)))

    edges = cv2.Canny(blur, 50, 150)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, k, iterations=2)

    cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for c in cnts:
        if len(c) < 80:
            continue
        area = float(cv2.contourArea(c))
        if area < 0.05 * h * w or area > 0.90 * h * w:
            continue

        perim = float(cv2.arcLength(c, True))
        if perim <= 1e-6:
            continue
        circ = float(4.0 * np.pi * area / (perim * perim))

        try:
            e = normalize_ellipse(cv2.fitEllipse(c))
        except cv2.error:
            continue

        (cx, cy), (maj, minr), _ = e
        if maj < 0.16 * min_hw or maj > 1.10 * min_hw:
            continue
        aspect = float(minr / max(maj, 1e-6))
        if aspect < 0.35:
            continue

        dist = float(np.hypot(cx - (w / 2.0), cy - (h / 2.0))) / max(min_hw, 1.0)
        score = (1.4 * (maj / max(min_hw, 1.0))) + (0.9 * aspect) + (1.0 * circ) - (1.2 * dist)
        cands.append((score, e))

    if not cands:
        return None

    cands.sort(key=lambda z: z[0], reverse=True)
    return cands[0][1]


def ellipse_deviation(candidate_ellipse, seed_ellipse, shape_hw):
    h, w = shape_hw
    (cx, cy), (maj, minr), _ = candidate_ellipse
    (sx, sy), (smaj, smin), _ = seed_ellipse

    center_dev = float(np.hypot(cx - sx, cy - sy)) / max(float(min(h, w)), 1.0)
    major_ratio = float(maj / max(smaj, 1e-6))
    area_ratio = float((maj * minr) / max(smaj * smin, 1e-6))
    aspect = float(minr / max(maj, 1e-6))
    size_dev = float(abs(np.log(max(area_ratio, 1e-6))))

    valid = (
        center_dev <= 0.18
        and 0.65 <= major_ratio <= 1.35
        and 0.55 <= area_ratio <= 1.65
        and aspect >= 0.35
    )

    return {
        "valid": valid,
        "center_dev": center_dev,
        "major_ratio": major_ratio,
        "area_ratio": area_ratio,
        "aspect": aspect,
        "size_dev": size_dev,
    }


def ellipse_points(cv_ellipse, t_values):
    (cx, cy), (major_d, minor_d), angle_deg = cv_ellipse
    a = 0.5 * float(major_d)
    b = 0.5 * float(minor_d)
    th = np.deg2rad(float(angle_deg))
    ct, st = np.cos(th), np.sin(th)

    pts = []
    for t in t_values:
        x = cx + a * np.cos(t) * ct - b * np.sin(t) * st
        y = cy + a * np.cos(t) * st + b * np.sin(t) * ct
        pts.append([x, y])
    return np.array(pts, dtype=np.float32), a


def circle_points(radius, t_values, center):
    cx, cy = center
    return np.stack([cx + radius * np.cos(t_values), cy + radius * np.sin(t_values)], axis=1).astype(np.float32)


def contour_circularity(mask: np.ndarray) -> float:
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cnts:
        return 0.0
    c = max(cnts, key=cv2.contourArea)
    a = float(cv2.contourArea(c))
    p = float(cv2.arcLength(c, True))
    if p <= 1e-6:
        return 0.0
    return float(4.0 * np.pi * a / (p * p))


def fit_ellipse_from_mask(mask: np.ndarray):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cnts:
        return None
    c = max(cnts, key=cv2.contourArea)
    if len(c) < 20:
        return None

    try:
        if hasattr(cv2, "fitEllipseAMS"):
            e = cv2.fitEllipseAMS(c)
        else:
            e = cv2.fitEllipse(c)
    except cv2.error:
        return None

    return normalize_ellipse(e)


def mask_from_seed_ellipse(shape_hw, ellipse, scale: float = 1.0):
    h, w = shape_hw
    mask = np.zeros((h, w), dtype=np.uint8)
    (cx, cy), (maj, minr), ang = ellipse
    cv2.ellipse(mask, ((cx, cy), (maj * scale, minr * scale), ang), 255, -1)
    return mask


def mask_from_edges(img_rgb: np.ndarray, ellipse_hint):
    h, w = img_rgb.shape[:2]
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    v = float(np.median(gray))
    lo = int(max(10, 0.67 * v))
    hi = int(min(255, 1.33 * v))
    edges = cv2.Canny(gray, lo, hi)

    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, k, iterations=2)

    cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cnts:
        return None

    (hx, hy), (hmaj, hmin), _ = ellipse_hint
    hint_area = float(np.pi * 0.25 * hmaj * hmin)
    best = None
    best_score = -1e18

    for c in cnts:
        if len(c) < 30:
            continue
        area = float(cv2.contourArea(c))
        if area < 0.003 * h * w:
            continue
        try:
            e = normalize_ellipse(cv2.fitEllipse(c))
        except cv2.error:
            continue

        (cx, cy), (maj, minr), _ = e
        if maj <= 1e-6 or minr <= 1e-6:
            continue

        e_area = float(np.pi * 0.25 * maj * minr)
        area_match = -abs(e_area - hint_area) / max(hint_area, 1.0)
        dist = float(np.hypot(cx - hx, cy - hy)) / max(min(h, w), 1)
        ar = minr / maj
        score = (1.8 * area_match) - (1.5 * dist) + (0.6 * ar)

        if score > best_score:
            best_score = score
            best = e

    if best is None:
        return None

    return mask_from_seed_ellipse((h, w), best, scale=1.03)


def mask_from_grabcut(img_rgb: np.ndarray, ellipse_hint, work_max_side: int = 600, iter_count: int = 2):
    """GrabCut on a downscaled copy to cut runtime ~4-8x, then upscale the mask.

    The downscaled side is bounded by `work_max_side`. Mask quality is preserved
    because grabCut operates on image regions (not pixel-perfect boundaries),
    and final morphology smooths the upsampled result.
    """
    h, w = img_rgb.shape[:2]
    if h == 0 or w == 0:
        return None

    long_side = max(h, w)
    scale = min(1.0, float(work_max_side) / float(long_side))

    if scale < 1.0:
        sw = max(1, int(round(w * scale)))
        sh = max(1, int(round(h * scale)))
        small_img = cv2.resize(img_rgb, (sw, sh), interpolation=cv2.INTER_AREA)
    else:
        small_img = img_rgb
        sw, sh = w, h

    (cx, cy), (maj, minr), ang = ellipse_hint
    s_cx, s_cy = cx * (sw / w), cy * (sh / h)
    s_maj, s_minr = maj * (sw / w), minr * (sh / h)

    mask_small = np.full((sh, sw), cv2.GC_BGD, dtype=np.uint8)
    outer = np.zeros((sh, sw), dtype=np.uint8)
    inner = np.zeros((sh, sw), dtype=np.uint8)

    cv2.ellipse(outer, ((s_cx, s_cy), (s_maj * 1.20, s_minr * 1.20), ang), 255, -1)
    cv2.ellipse(inner, ((s_cx, s_cy), (s_maj * 0.80, s_minr * 0.80), ang), 255, -1)

    mask_small[outer > 0] = cv2.GC_PR_FGD
    mask_small[inner > 0] = cv2.GC_FGD

    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)

    try:
        cv2.grabCut(small_img, mask_small, None, bgd, fgd, int(max(1, iter_count)), cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        return None

    out_small = np.where((mask_small == cv2.GC_FGD) | (mask_small == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    if scale < 1.0:
        out = cv2.resize(out_small, (w, h), interpolation=cv2.INTER_NEAREST)
    else:
        out = out_small

    out = cv2.morphologyEx(out, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=1)
    out = cv2.morphologyEx(out, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=1)
    return out


def compute_homography_from_ellipse(ellipse, out_radius: float, n_pts: int = 64, fill_ratio: float = 0.84):
    t_vals = np.linspace(0.0, 2.0 * np.pi, n_pts, endpoint=False).astype(np.float32)
    src_pts, _ = ellipse_points(ellipse, t_vals)

    out_side = int(max(120, round((2.0 * out_radius) / max(float(fill_ratio), 1e-3))))
    c_dst = (out_side / 2.0, out_side / 2.0)
    dst_pts = circle_points(float(out_radius), t_vals, c_dst)

    method = cv2.USAC_MAGSAC if hasattr(cv2, "USAC_MAGSAC") else cv2.RANSAC
    H, inlier_mask = cv2.findHomography(
        src_pts,
        dst_pts,
        method=method,
        ransacReprojThreshold=2.0,
        maxIters=10000,
        confidence=0.999,
    )

    if H is None:
        return None

    proj = cv2.perspectiveTransform(src_pts.reshape(-1, 1, 2), H).reshape(-1, 2)
    rmse = float(np.sqrt(np.mean(np.sum((proj - dst_pts) ** 2, axis=1))))

    inlier_ratio = 0.0
    if inlier_mask is not None and inlier_mask.size > 0:
        inlier_ratio = float(np.mean(inlier_mask.ravel() > 0))

    return {
        "H": H,
        "rmse": rmse,
        "inlier_ratio": inlier_ratio,
        "out_side": out_side,
    }


def edge_touch_ratio(mask: np.ndarray, band: int = 3) -> float:
    m = (mask > 0).astype(np.uint8)
    total = int(np.count_nonzero(m))
    if total == 0:
        return 1.0

    h, w = m.shape
    b = int(max(1, band))
    edge = np.zeros_like(m)
    edge[:b, :] = 1
    edge[h - b :, :] = 1
    edge[:, :b] = 1
    edge[:, w - b :] = 1

    touch = int(np.count_nonzero((m > 0) & (edge > 0)))
    return float(touch) / float(total)


def recenter_crop_by_mask(img_rgb: np.ndarray, mask: np.ndarray, margin_ratio: float = 0.12):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cnts:
        return img_rgb, mask, 1.0

    c = max(cnts, key=cv2.contourArea)
    (cx, cy), r = cv2.minEnclosingCircle(c)
    if r < 8.0:
        return img_rgb, mask, 1.0

    h, w = mask.shape
    tx = 0.5 * w
    ty = 0.5 * h

    M = np.array([[1.0, 0.0, tx - cx], [0.0, 1.0, ty - cy]], dtype=np.float32)
    shifted_img = cv2.warpAffine(img_rgb, M, (w, h), flags=cv2.INTER_CUBIC)
    shifted_mask = cv2.warpAffine(mask, M, (w, h), flags=cv2.INTER_NEAREST)
    shifted_mask = (shifted_mask > 0).astype(np.uint8) * 255

    r_out = float(r) * (1.0 + float(margin_ratio))
    side = int(max(64, round(2.0 * r_out)))
    half = side // 2

    cx2 = int(round(tx))
    cy2 = int(round(ty))
    x0 = cx2 - half
    y0 = cy2 - half
    x1 = x0 + side
    y1 = y0 + side

    clip = 0.0
    clip += max(0.0, -x0)
    clip += max(0.0, -y0)
    clip += max(0.0, x1 - w)
    clip += max(0.0, y1 - h)
    clip_ratio = float(clip) / max(float(side), 1.0)

    x0 = max(0, x0)
    y0 = max(0, y0)
    x1 = min(w, x1)
    y1 = min(h, y1)

    out_img = shifted_img[y0:y1, x0:x1].copy()
    out_mask = shifted_mask[y0:y1, x0:x1].copy()

    if out_img.size == 0:
        return shifted_img, shifted_mask, 1.0

    return out_img, out_mask, clip_ratio


def quality_postprocess(raw_warp: np.ndarray, raw_mask: np.ndarray):
    raw_sharp = laplacian_var(raw_warp)
    out = raw_warp.copy()
    out_sharp = raw_sharp

    if raw_sharp < 60.0:
        us = mild_unsharp_luma(raw_warp, amount=0.20, sigma=1.0)
        s_us = laplacian_var(us)
        d_ab, d_all = lab_color_shift(raw_warp, us, raw_mask)

        if s_us > 1.05 * raw_sharp and d_ab <= 1.8 and d_all <= 2.5:
            out = us
            out_sharp = s_us

    return out, out_sharp


def build_homography_candidate(img_awal: np.ndarray, mask_src: np.ndarray, ellipse, label: str, seed_ellipse):
    dev = ellipse_deviation(ellipse, seed_ellipse, img_awal.shape[:2])
    if not dev["valid"]:
        return None

    src_touch = edge_touch_ratio(mask_src, band=2)
    if src_touch > 0.08:
        return None

    (_, _), (maj, minr), _ = ellipse
    out_radius = max(20.0, 0.5 * max(maj, minr))

    Hpack = compute_homography_from_ellipse(ellipse, out_radius, n_pts=64, fill_ratio=0.84)
    if Hpack is None:
        return None

    H = Hpack["H"]
    out_side = Hpack["out_side"]

    warps = {}
    for name, interp in (("lanczos", cv2.INTER_LANCZOS4), ("cubic", cv2.INTER_CUBIC), ("linear", cv2.INTER_LINEAR)):
        warps[name] = cv2.warpPerspective(img_awal, H, (out_side, out_side), flags=interp)

    best_interp = None
    best_raw = None
    best_raw_sharp = -1.0
    for name, w in warps.items():
        s = laplacian_var(w)
        if s > best_raw_sharp:
            best_raw_sharp = s
            best_interp = name
            best_raw = w

    wm = cv2.warpPerspective(mask_src, H, (out_side, out_side), flags=cv2.INTER_NEAREST)
    wm = (wm > 0).astype(np.uint8) * 255

    raw_crop, wm_crop, clip_ratio = recenter_crop_by_mask(best_raw, wm, margin_ratio=0.12)
    best_warp, best_sharp = quality_postprocess(raw_crop, wm_crop)

    sharp_src = laplacian_var_mask(img_awal, mask_src)
    sharp_dst = laplacian_var_mask(best_warp, wm_crop)
    sharp_ratio = float(sharp_dst / max(sharp_src, 1e-6))

    circ = contour_circularity(wm_crop)
    touch = edge_touch_ratio(wm_crop, band=3)
    prior = {"seed-ellipse": -0.12, "edge-mask": 0.10, "grabcut-mask": 0.16}.get(label, 0.0)

    score = (
        (0.009 * best_sharp)
        + (2.2 * circ)
        - (2.7 * touch)
        - (2.4 * clip_ratio)
        - (4.2 * dev["center_dev"])
        - (2.4 * dev["size_dev"])
        - (1.2 * src_touch)
        + (0.8 * min(sharp_ratio, 1.8))
        + (0.3 * Hpack["inlier_ratio"])
        - (0.10 * Hpack["rmse"])
        + prior
    )

    d_ab, d_all = lab_color_shift(raw_crop, best_warp, wm_crop)

    return {
        "kind": "homography",
        "label": label,
        "ellipse": ellipse,
        "warp": best_warp,
        "interp": best_interp,
        "sharp": best_sharp,
        "sharp_ratio": sharp_ratio,
        "inlier_ratio": Hpack["inlier_ratio"],
        "rmse": Hpack["rmse"],
        "circularity": circ,
        "edge_touch": touch,
        "clip_ratio": clip_ratio,
        "center_dev": dev["center_dev"],
        "size_dev": dev["size_dev"],
        "color_shift_ab": d_ab,
        "color_shift_all": d_all,
        "score": score,
        "warp_mask": wm_crop,
    }


def build_affine_candidate(img_awal: np.ndarray, mask_src: np.ndarray, ellipse, label: str, seed_ellipse):
    dev = ellipse_deviation(ellipse, seed_ellipse, img_awal.shape[:2])
    if not dev["valid"]:
        return None

    src_touch = edge_touch_ratio(mask_src, band=2)
    if src_touch > 0.08:
        return None

    (cx, cy), (maj, minr), angle_deg = ellipse
    ratio = float(maj / max(minr, 1e-6))
    theta = np.deg2rad(float(angle_deg))
    R = np.array([[np.cos(theta), -np.sin(theta)], [np.sin(theta), np.cos(theta)]], dtype=np.float32)
    S = np.array([[1.0, 0.0], [0.0, ratio]], dtype=np.float32)
    A = R @ S @ R.T
    c = np.array([cx, cy], dtype=np.float32)
    t = c - (A @ c)
    M = np.hstack([A, t.reshape(2, 1)]).astype(np.float32)

    h, w = img_awal.shape[:2]
    warps = {}
    for name, interp in (("lanczos", cv2.INTER_LANCZOS4), ("cubic", cv2.INTER_CUBIC), ("linear", cv2.INTER_LINEAR)):
        warps[name] = cv2.warpAffine(img_awal, M, (w, h), flags=interp)

    best_interp = None
    best_raw = None
    best_raw_sharp = -1.0
    for name, wa in warps.items():
        s = laplacian_var(wa)
        if s > best_raw_sharp:
            best_raw_sharp = s
            best_interp = name
            best_raw = wa

    wm = cv2.warpAffine(mask_src, M, (w, h), flags=cv2.INTER_NEAREST)
    wm = (wm > 0).astype(np.uint8) * 255

    raw_crop, wm_crop, clip_ratio = recenter_crop_by_mask(best_raw, wm, margin_ratio=0.12)
    best_warp, best_sharp = quality_postprocess(raw_crop, wm_crop)

    sharp_src = laplacian_var_mask(img_awal, mask_src)
    sharp_dst = laplacian_var_mask(best_warp, wm_crop)
    sharp_ratio = float(sharp_dst / max(sharp_src, 1e-6))

    circ = contour_circularity(wm_crop)
    touch = edge_touch_ratio(wm_crop, band=3)
    prior = {"seed-ellipse": 0.04, "edge-mask": 0.08, "grabcut-mask": 0.12}.get(label, 0.0)

    score = (
        (0.010 * best_sharp)
        + (2.2 * circ)
        - (2.8 * touch)
        - (2.4 * clip_ratio)
        - (3.8 * dev["center_dev"])
        - (2.2 * dev["size_dev"])
        - (1.2 * src_touch)
        + (1.0 * min(sharp_ratio, 1.8))
        + prior
    )

    d_ab, d_all = lab_color_shift(raw_crop, best_warp, wm_crop)

    return {
        "kind": "affine",
        "label": label,
        "ellipse": ellipse,
        "warp": best_warp,
        "interp": best_interp,
        "sharp": best_sharp,
        "sharp_ratio": sharp_ratio,
        "inlier_ratio": None,
        "rmse": None,
        "circularity": circ,
        "edge_touch": touch,
        "clip_ratio": clip_ratio,
        "center_dev": dev["center_dev"],
        "size_dev": dev["size_dev"],
        "color_shift_ab": d_ab,
        "color_shift_all": d_all,
        "score": score,
        "warp_mask": wm_crop,
    }


def crop_by_mask(img_rgb: np.ndarray, mask: np.ndarray, pad_ratio: float = 0.03):
    if img_rgb is None or mask is None:
        return img_rgb
    ys, xs = np.nonzero(mask)
    if xs.size == 0:
        return img_rgb
    h, w = mask.shape[:2]
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    side = max(1, x1 - x0, y1 - y0)
    pad = int(round(float(pad_ratio) * float(side)))
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(w, x1 + pad)
    y1 = min(h, y1 + pad)
    return img_rgb[y0:y1, x0:x1].copy()


def process_image_rgb(img_rgb: np.ndarray) -> HomographyResult:
    reasons: list[str] = []

    img_awal = resize_rgb(img_rgb, max_side=1600)
    img_pol, _ = polarization_filter_remove_reflection(img_awal)

    _smooth, img_sharp = bilateral_unsharp(img_awal)

    glare_mask = detect_glare_mask(img_sharp)
    glare_ratio = float(np.count_nonzero(glare_mask)) / float(glare_mask.size)
    img_enh = inpaint_glare(img_sharp, glare_mask, radius=7)

    seed_ellipse = estimate_seed_ellipse(img_enh)
    if seed_ellipse is not None:
        seed_ellipse = normalize_ellipse(seed_ellipse)

    if not seed_is_plausible(seed_ellipse, img_awal.shape[:2]):
        seed_ellipse = estimate_seed_ellipse(img_pol)
        if seed_ellipse is not None:
            seed_ellipse = normalize_ellipse(seed_ellipse)

    if seed_ellipse is None:
        reasons.append("cawan petri tidak terdeteksi")
        return HomographyResult(image_rgb=img_enh, ok=False, reasons=reasons)

    candidate_results = []

    masks = [("seed-ellipse", mask_from_seed_ellipse(img_enh.shape[:2], seed_ellipse, scale=1.0))]

    m_edge = mask_from_edges(img_enh, seed_ellipse)
    if m_edge is not None and np.count_nonzero(m_edge) > 200:
        masks.append(("edge-mask", m_edge))

    m_gc = mask_from_grabcut(img_enh, seed_ellipse)
    if m_gc is not None and np.count_nonzero(m_gc) > 200:
        masks.append(("grabcut-mask", m_gc))

    for m_label, m in masks:
        e = fit_ellipse_from_mask(m)
        if e is None:
            continue

        c_h = build_homography_candidate(img_awal, m, e, m_label, seed_ellipse)
        if c_h is not None:
            candidate_results.append(c_h)

        c_a = build_affine_candidate(img_awal, m, e, m_label, seed_ellipse)
        if c_a is not None:
            candidate_results.append(c_a)

    selected = max(candidate_results, key=lambda z: z["score"]) if candidate_results else None
    petri_only = None

    if selected is not None:
        wm = selected["warp_mask"]
        petri_only = cv2.bitwise_and(selected["warp"], selected["warp"], mask=wm)

        if selected["kind"] == "homography":
            if selected.get("inlier_ratio") is not None and selected["inlier_ratio"] < 0.55:
                reasons.append("korespondensi titik homografi tidak konsisten")
            if selected.get("rmse") is not None and selected["rmse"] > 3.0:
                reasons.append("akurasi homografi rendah")

        if selected["circularity"] < 0.72:
            reasons.append("bentuk cawan setelah rectification belum stabil")
        if selected["edge_touch"] > 0.10 or selected["clip_ratio"] > 0.10:
            reasons.append("cawan terlalu dekat batas frame hasil")
        if selected["color_shift_ab"] > 2.2 or selected["color_shift_all"] > 3.0:
            reasons.append("perubahan warna terlalu besar")

        blur_awal = laplacian_var(img_awal)
        blur_final = laplacian_var(selected["warp"])
        if blur_final < 0.58 * blur_awal and blur_final < 45.0:
            reasons.append("hasil homografi kehilangan detail")
    else:
        reasons.append("homografi tidak dapat dihitung")

    if glare_ratio > 0.08:
        reasons.append("pantulan cahaya terlalu kuat")

    if petri_only is not None and selected is not None:
        final = crop_by_mask(petri_only, selected["warp_mask"])
    elif selected is not None:
        final = selected["warp"]
    else:
        final = img_enh

    ok = len(reasons) == 0
    return HomographyResult(image_rgb=final, ok=ok, reasons=reasons)


def process_image_bytes(image_bytes: bytes) -> HomographyResult:
    img_rgb = decode_image_bytes_to_rgb(image_bytes)
    return process_image_rgb(img_rgb)
