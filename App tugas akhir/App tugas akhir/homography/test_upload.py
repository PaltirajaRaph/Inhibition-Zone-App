import numpy as np
import cv2
img = np.full((300,400,3), 255, dtype=np.uint8)
cv2.putText(img, 'TEST', (50,160), cv2.FONT_HERSHEY_SIMPLEX, 4, (0,0,255), 8, cv2.LINE_AA)
cv2.imwrite('homography/test_upload.jpg', img)
print('Wrote homography/test_upload.jpg')
