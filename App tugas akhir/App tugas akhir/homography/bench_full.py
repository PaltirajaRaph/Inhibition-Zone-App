import time, numpy as np, cv2
from pipeline import process_image_rgb
H, W = 3000, 4000
img = np.zeros((H, W, 3), dtype=np.uint8)
cv2.circle(img, (W//2, H//2), 1200, (255, 255, 255), -1)
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
for i in range(3):
    s = time.time(); process_image_rgb(img_rgb); print(f"Full run {i+1}: {(time.time()-s)*1000:.1f} ms")