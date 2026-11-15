import math

class Vector3:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

def lookAt(eye, target, up):
    zx = eye.x - target.x
    zy = eye.y - target.y
    zz = eye.z - target.z
    zl = math.sqrt(zx*zx + zy*zy + zz*zz) or 1.0
    zx /= zl; zy /= zl; zz /= zl
    
    xx = up.y * zz - up.z * zy
    xy = up.z * zx - up.x * zz
    xz = up.x * zy - up.y * zx
    xl = math.sqrt(xx*xx + xy*xy + xz*xz)
    if xl == 0:
        return None
    xx /= xl; xy /= xl; xz /= xl
    
    yx = zy * xz - zz * xy
    yy = zz * xx - zx * xz
    yz = zx * xy - zy * xx
    return yy # Camera Up vector Y component in world space

DEG2RAD = math.pi / 180
target = Vector3(0, 0.65, 0)
up = Vector3(0, 1, 0)

all_upright = True
for polar_deg in range(10, 89):
    for az_deg in range(0, 360, 5):
        p = polar_deg * DEG2RAD
        a = az_deg * DEG2RAD
        dist = 6.0
        eye = Vector3(
            target.x + dist * math.sin(p) * math.sin(a),
            target.y + dist * math.cos(p),
            target.z + dist * math.sin(p) * math.cos(a)
        )
        cam_up_y = lookAt(eye, target, up)
        if cam_up_y is None or cam_up_y <= 0:
            print(f"NOT UPRIGHT at polar={polar_deg}, az={az_deg}: {cam_up_y}")
            all_upright = False

if all_upright:
    print("SUCCESS: 100% of all 360° azimuth angles and 10°-88° polar angles are strictly upright and stable!")

