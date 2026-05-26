import time, numpy as np, cv2
from pipeline import (resize_rgb, polarization_filter_remove_reflection, bilateral_unsharp, detect_glare_mask, inpaint_glare, estimate_seed_ellipse, mask_from_grabcut, fit_ellipse_from_mask)
H, W = 3000, 4000
img = np.zeros((H, W, 3), dtype=np.uint8)
cv2.circle(img, (W//2, H//2), 1200, (255, 255, 255), -1)
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
def t(l, fn, *a): s=time.time(); r=fn(*a); print(f"{l:40s}: {(time.time()-s)*1000:8.1f} ms"); return r
img_1600 = t("resize_rgb", resize_rgb, img_rgb, 1600)
img_pol = t("polarization", polarization_filter_remove_reflection, img_1600)
res_sharp = t("bilateral_unsharp", bilateral_unsharp, img_1600)
img_sharp = res_sharp[1]
glare_mask = t("detect_glare", detect_glare_mask, img_sharp)
img_enh = t("inpaint_glare", inpaint_glare, img_sharp, glare_mask, 7)
seed = t("estimate_seed_ellipse", estimate_seed_ellipse, img_enh)
if seed:
    mask_gc = t("mask_from_grabcut", mask_from_grabcut, img_1600, seed)
    t("fit_ellipse_from_mask", fit_ellipse_from_mask, mask_gc)