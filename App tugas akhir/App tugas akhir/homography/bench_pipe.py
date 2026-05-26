import time, numpy as np, cv2
from pipeline import (resize_rgb, polarization_filter_remove_reflection, bilateral_unsharp, detect_glare_mask, inpaint_glare, estimate_seed_ellipse, process_image_rgb)
H, W = 3000, 4000
img = np.full((H, W, 3), 30, dtype=np.uint8)
cv2.circle(img, (W//2, H//2), 1200, (220, 220, 215), -1)
cv2.circle(img, (W//2, H//2), 1180, (250, 250, 248), -1)
for cx, cy in [(W//2-400, H//2-300), (W//2+350, H//2-200), (W//2-100, H//2+400)]:
    cv2.circle(img, (cx, cy), 70, (140,140,140), -1)
noise = (np.random.randn(H, W, 3) * 8).astype(np.int16)
img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
def t(label, fn, *args, **kwargs):
    s = time.time()
    r = fn(*args, **kwargs)
    print(f'{label:40s}: {(time.time()-s)*1000:8.1f} ms')
    return r
print('--- Full process_image_rgb (3 runs) ---')
for i in range(3):
    s = time.time(); process_image_rgb(img_rgb); print(f'  Full run {i+1}: {(time.time()-s)*1000:.1f} ms')
print('--- Per-step breakdown ---')
img_awal = t('resize_rgb(max_side=1600)', resize_rgb, img_rgb, 1600)
img_pol, _ = t('polarization_filter_remove_reflection', polarization_filter_remove_reflection, img_awal)
_, img_sharp = t('bilateral_unsharp', bilateral_unsharp, img_awal)
glare_mask = t('detect_glare_mask', detect_glare_mask, img_sharp)
img_enh = t('inpaint_glare', inpaint_glare, img_sharp, glare_mask, 7)
seed_ellipse = t('estimate_seed_ellipse', estimate_seed_ellipse, img_enh)
print('seed_ellipse:', 'OK' if seed_ellipse else 'None')