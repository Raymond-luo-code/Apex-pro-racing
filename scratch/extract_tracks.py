import struct, json, math

def load_glb(path):
    with open(path, 'rb') as f:
        data = f.read()
    jlen, _ = struct.unpack_from('<II', data, 12)
    gltf = json.loads(data[20:20+jlen].decode('utf-8'))
    bin_data = data[20+jlen+8:]
    return gltf, bin_data

def get_verts(gltf, bin_data, acc_idx):
    acc = gltf['accessors'][acc_idx]
    bv = gltf['bufferViews'][acc['bufferView']]
    offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count']
    stride = bv.get('byteStride', 12)
    return [struct.unpack_from('<fff', bin_data, offset + i * stride) for i in range(count)]

def transform_loop(pts, origin, forward_vec, scale=1.0):
    ox, oy, oz = origin
    fx, fz = forward_vec
    ang = math.atan2(fz, fx)
    ca, sa = math.cos(-ang), math.sin(-ang)
    out = []
    for x, y, z in pts:
        dx, dy, dz = x - ox, y - oy, z - oz
        rx = (dx * ca - dz * sa) * scale
        rz = (dx * sa + dz * ca) * scale
        ry = dy * scale
        out.append((round(rx, 1), round(ry, 1), round(rz, 1)))
    return out, round(-ang, 5)

# 1. Suzuka chunk sequence
gltf_z, bin_z = load_glb('assets/models/tracks/suzuka_circuit.glb')
chunk_map = {}
for n in gltf_z.get('nodes', []):
    nm = n.get('name','')
    if nm.startswith('gnd_road_') and 'road_common-track' in nm and 'mesh' in n:
        t = n.get('translation', [0,0,0])
        v = get_verts(gltf_z, bin_z, gltf_z['meshes'][n['mesh']]['primitives'][0]['attributes']['POSITION'])
        pts = [(pt[0]+t[0], pt[1]+t[1], pt[2]+t[2]) for pt in v]
        chunk_map[nm[9:11]] = pts

# Check exact Crossing of Underpass (24->23->22 vs 17->03->01)
for cid in ['15','30','14','29','28','27','06','13','26','05','04','02','07','25','24','23','22','21','20','12','11','19','10','09','18','08','17','03','01','16']:
    pts = chunk_map[cid]
    cx = sum(p[0] for p in pts)/len(pts); cy = sum(p[1] for p in pts)/len(pts); cz = sum(p[2] for p in pts)/len(pts)
    print(f'Suzuka {cid}: ({cx:.1f}, {cy:.1f}, {cz:.1f})')

suz_order = ['15','30','14','29','28','27','06','13','26','05','07','25','24','23','22','21','20','12','11','19','10','09','18','08','17','03','01','02','04','16']
suz_raw = []
for cid in suz_order:
    pts = chunk_map[cid]
    suz_raw.append((sum(p[0] for p in pts)/len(pts), sum(p[1] for p in pts)/len(pts), sum(p[2] for p in pts)/len(pts)))
p_sf = suz_raw[0]
p_nx = suz_raw[1]
suz_len = sum(math.hypot(suz_raw[(i+1)%len(suz_raw)][0]-suz_raw[i][0], suz_raw[(i+1)%len(suz_raw)][2]-suz_raw[i][2]) for i in range(len(suz_raw)))
scale_z = 5250.0 / suz_len
suz_pts, ang_z = transform_loop(suz_raw, p_sf, (p_nx[0]-p_sf[0], p_nx[2]-p_sf[2]), scale=scale_z)
print(f'Suzuka raw_len={suz_len:.1f}, scale={scale_z:.4f}, rotY={ang_z}, origin={p_sf}')
print('SUZUKA_PTS =', suz_pts)

# 2. Spa triangle-edge trace on prim 21
gltf_s, bin_s = load_glb('assets/models/tracks/spa_francorchamps.glb')
p21 = gltf_s['meshes'][0]['primitives'][21]
v = get_verts(gltf_s, bin_s, p21['attributes']['POSITION'])
# Check sequential strips of prim 21 indices or trace along road triangles by centroid proximity!
acc = gltf_s['accessors'][p21['indices']]
bv = gltf_s['bufferViews'][acc['bufferView']]
off = bv.get('byteOffset',0)+acc.get('byteOffset',0)
fmt = '<H' if acc['componentType']==5123 else '<I'
sz = 2 if acc['componentType']==5123 else 4
idx = [struct.unpack_from(fmt, bin_s, off+i*sz)[0] for i in range(acc['count'])]
# Transform vertices by +90 X rot: x_w = x, y_w = -z, z_w = y
w_verts = [(pt[0], -pt[2], pt[1]) for pt in v]
# Build triangle centroids
tri_c = []
for i in range(0, len(idx), 3):
    a, b, c = w_verts[idx[i]], w_verts[idx[i+1]], w_verts[idx[i+2]]
    tri_c.append(((a[0]+b[0]+c[0])/3, (a[1]+b[1]+c[1])/3, (a[2]+b[2]+c[2])/3))

# Follow F1 Spa grid (3770, 307, -3685) heading toward La Source (-Z = 0, -1 -> then Eau Rouge!)
# Let's bin tri_c into 120-unit cells and find connected graph path from grid!
cell_sz = 140.0
cells = {}
for p in tri_c:
    k = (round(p[0]/cell_sz), round(p[1]/cell_sz), round(p[2]/cell_sz))
    cells.setdefault(k, []).append(p)
node_list = [(k, (sum(p[0] for p in arr)/len(arr), sum(p[1] for p in arr)/len(arr), sum(p[2] for p in arr)/len(arr))) for k, arr in cells.items()]
# Filter out pitlane / old layout spurs: let's find longest simple cycle via DFS/BFS or greedy + closure!
print('Spa cells count:', len(node_list))
start_i = min(range(len(node_list)), key=lambda i: math.dist(node_list[i][1], (3770, 307, -3685)))
print('Spa start cell:', node_list[start_i][1])
# Print nearest 6 neighbors of start_i to verify direction toward Eau Rouge (z ~ -4800.. -5300) vs Bus Stop (z ~ -3000)
cur_p = node_list[start_i][1]
for i, (_, p) in enumerate(node_list):
    if 80 < math.dist(p, cur_p) < 420:
        print('  nbr:', round(p[0],1), round(p[1],1), round(p[2],1))
