import math

# Simulate Three.js Matrix4.lookAt and Euler conversion
class Vector3:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

def lookAt(eye, target, up):
    # z = normalize(eye - target)
    zx = eye.x - target.x
    zy = eye.y - target.y
    zz = eye.z - target.z
    zl = math.sqrt(zx*zx + zy*zy + zz*zz) or 1.0
    zx /= zl; zy /= zl; zz /= zl
    
    # x = normalize(cross(up, z))
    xx = up.y * zz - up.z * zy
    xy = up.z * zx - up.x * zz
    xz = up.x * zy - up.y * zx
    xl = math.sqrt(xx*xx + xy*xy + xz*xz)
    if xl == 0:
        # Gimbal lock at pole!
        print("POLE GIMBAL LOCK! Cross product is zero!")
        return None
    xx /= xl; xy /= xl; xz /= xl
    
    # y = cross(z, x)
    yx = zy * xz - zz * xy
    yy = zz * xx - zx * xz
    yz = zx * xy - zy * xx
    
    # Matrix elements
    # [ xx, yx, zx ]
    # [ xy, yy, zy ]
    # [ xz, yz, zz ]
    return [
        [xx, yx, zx],
        [xy, yy, zy],
        [xz, yz, zz]
    ]

# Test across various azimuth and polar angles
DEG2RAD = math.pi / 180
target = Vector3(0, 0.65, 0)
up = Vector3(0, 1, 0)

for polar_deg in [15, 30, 45, 60, 75, 80, 85]:
    for az_deg in [0, 45, 90, 135, 180, 225, 270, 315]:
        p = polar_deg * DEG2RAD
        a = az_deg * DEG2RAD
        dist = 6.0
        eye = Vector3(
            target.x + dist * math.sin(p) * math.sin(a),
            target.y + dist * math.cos(p),
            target.z + dist * math.sin(p) * math.cos(a)
        )
        m = lookAt(eye, target, up)
        # Check camera up vector in world space: yx, yy, yz
        # If camera is upright, camera up vector's Y component (yy) MUST be positive!
        cam_up_y = m[1][1]
        # In Three.js, if camera.rotation.z = 0 is applied:
        # Euler extraction for XYZ order:
        # m = [ [m11, m12, m13], [m21, m22, m23], [m31, m32, m33] ]
        # y = asin(clamp(m13, -1, 1))
        # if abs(m13) < 0.9999:
        #   x = atan2(-m23, m33)
        #   z = atan2(-m12, m11)
        m11, m12, m13 = m[0][0], m[0][1], m[0][2]
        m21, m22, m23 = m[1][0], m[1][1], m[1][2]
        m31, m32, m33 = m[2][0], m[2][1], m[2][2]
        
        # When rotation.z is forced to 0, reconstructed matrix has:
        # col2 (up vector) y component = cos(x)
        ey = math.asin(max(-1.0, min(1.0, m13)))
        ex = math.atan2(-m23, m33)
        ez = math.atan2(-m12, m11)
        
        # If ez is non-zero (which it is for almost all angles!), forcing ez = 0 alters the matrix!
        reconstructed_up_y = math.cos(ex)
        if reconstructed_up_y < 0:
            print(f"FLIP DETECTED at polar={polar_deg}, az={az_deg}! Reconstructed up_y = {reconstructed_up_y:.3f}, ez was {ez*180/math.pi:.1f} deg")

