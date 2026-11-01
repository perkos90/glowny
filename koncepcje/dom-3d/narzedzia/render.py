import bpy, sys, math, mathutils
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
glb, out, view, W, H, samples = argv[0], argv[1], argv[2], int(argv[3]), int(argv[4]), int(argv[5])
concept = '1' if ('k1' in glb or 'house1' in glb) else '2'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
# usuń importowane światła (przeliczymy własne)
lamp_pos = []
for o in list(sc.objects):
    if o.type == 'LIGHT':
        lamp_pos.append((o.data.type, o.matrix_world.copy())); bpy.data.objects.remove(o, do_unlink=True)

def nodes(m):
    m.use_nodes = True; return m.node_tree.nodes, m.node_tree.links
def bsdf(m):
    n, _ = nodes(m); return next((x for x in n if x.type == 'BSDF_PRINCIPLED'), None)
def bevel(m, r=0.004):
    n, l = nodes(m); b = bsdf(m)
    if not b or b.inputs['Normal'].is_linked: return
    bv = n.new('ShaderNodeBevel'); bv.inputs['Radius'].default_value = r; bv.samples = 4; l.new(bv.outputs['Normal'], b.inputs['Normal'])
def emission(m, col, strength):
    n, l = nodes(m); n.clear(); o = n.new('ShaderNodeOutputMaterial'); e = n.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*col, 1); e.inputs['Strength'].default_value = strength; l.new(e.outputs[0], o.inputs[0])

for m in bpy.data.materials:
    b = bsdf(m); nm = m.name
    if nm == 'glow': emission(m, (1, .86, .66), 18); continue
    if nm == 'garden':
        n, l = nodes(m); n.clear(); o = n.new('ShaderNodeOutputMaterial'); e = n.new('ShaderNodeEmission'); e.inputs['Strength'].default_value = 2.2
        t = n.new('ShaderNodeTexImage'); t.image = bpy.data.images.load('/tmp/blend/garden.jpg'); l.new(t.outputs[0], e.inputs[0])
        l.new(e.outputs[0], o.inputs[0]); continue
    if not b: continue
    if nm == 'glass':
        b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Transmission Weight'].default_value = 1; b.inputs['Roughness'].default_value = 0; b.inputs['Alpha'].default_value = 1; m.blend_method = 'OPAQUE' if hasattr(m, 'blend_method') else None; continue
    if nm in ('wall', 'wall2'): b.inputs['Roughness'].default_value = .85
    if nm == 'floor': b.inputs['Roughness'].default_value = .42; b.inputs['Coat Weight'].default_value = .15
    if nm in ('oak', 'oakD'): b.inputs['Roughness'].default_value = .5
    if nm in ('black',): b.inputs['Roughness'].default_value = .45
    if nm == 'blackG': b.inputs['Roughness'].default_value = .15
    if nm == 'brass': b.inputs['Metallic'].default_value = 1; b.inputs['Roughness'].default_value = .28; b.inputs['Base Color'].default_value = (.78, .56, .25, 1)
    if nm in ('boucle', 'linen'): b.inputs['Sheen Weight'].default_value = .6; b.inputs['Roughness'].default_value = 1
    if nm == 'shade': b.inputs['Subsurface Weight'].default_value = .4; b.inputs['Transmission Weight'].default_value = .25
    if nm == 'screen': b.inputs['Roughness'].default_value = .08; b.inputs['Base Color'].default_value = (.01, .011, .012, 1)
    if nm in ('cer', 'white'): b.inputs['Roughness'].default_value = .35
    if nm == 'rug': b.inputs['Sheen Weight'].default_value = .5
    bevel(m, .002 if nm.startswith('book') else .004)

for o in sc.objects:
    if o.type != 'MESH' or not o.data.materials: continue
    mn = o.data.materials[0].name if o.data.materials[0] else ''
    if mn in ('glass', 'garden'): o.visible_shadow = False
    if mn == 'garden': o.visible_diffuse = False; o.visible_glossy = True
    if mn == 'linen' and o.dimensions.z > 4: pass

# zasłony: przepuszczają trochę światła
# świat: niebo
wd = bpy.data.worlds.new('W'); sc.world = wd; wd.use_nodes = True; wn = wd.node_tree.nodes; wl = wd.node_tree.links; wn.clear()
bg = wn.new('ShaderNodeBackground'); sky = wn.new('ShaderNodeTexSky'); wo = wn.new('ShaderNodeOutputWorld')
try: sky.sky_type = 'NISHITA'
except Exception: pass
try: sky.sun_disc = False
except Exception: pass
sky.sun_elevation = math.radians(28); sky.sun_rotation = math.radians(200)
bg.inputs['Strength'].default_value = .55; wl.new(sky.outputs[0], bg.inputs[0]); wl.new(bg.outputs[0], wo.inputs[0])

# słońce (kierunek jak w modelu webowym), three(X,Y,Z) -> blender(X,-Z,Y)
d3 = mathutils.Vector((12.8, -8.2, -4.2)); db = mathutils.Vector((d3.x, -d3.z, d3.y)).normalized()
sd = bpy.data.lights.new('sun', 'SUN'); sd.energy = 5.5; sd.angle = math.radians(.8); sd.color = (1, .91, .78)
so = bpy.data.objects.new('sun', sd); sc.collection.objects.link(so); so.rotation_euler = db.to_track_quat('-Z', 'Y').to_euler()
# liście – tylko cień
img = bpy.data.images.load('/tmp/blend/leaves.png'); lm = bpy.data.materials.new('leaves'); n, l = nodes(lm); n.clear()
o_ = n.new('ShaderNodeOutputMaterial'); mx = n.new('ShaderNodeMixShader'); tr = n.new('ShaderNodeBsdfTransparent'); df = n.new('ShaderNodeBsdfDiffuse'); tx = n.new('ShaderNodeTexImage'); tx.image = img
l.new(tx.outputs['Color'], mx.inputs[0]); l.new(tr.outputs[0], mx.inputs[1]); l.new(df.outputs[0], mx.inputs[2]); l.new(mx.outputs[0], o_.inputs[0])
for px, pz, s in [(-8.2, 3.0, 4.5), (-8.6, 0.2, 3.5), (-8.0, 5.8, 3.0)]:
    bpy.ops.mesh.primitive_plane_add(size=1, location=(px, -pz, 4.6)); p = bpy.context.active_object; p.scale = (s, s * 1.2, 1)
    p.rotation_euler = (math.radians(90), 0, math.radians(90 + 17)); p.data.materials.append(lm); p.visible_camera = False; p.visible_glossy = False; p.visible_diffuse = False
# światła wnętrza w miejscach z modelu (punktowe/spot) – ciepłe, delikatne (dzień)
for t, mw in lamp_pos:
    ld = bpy.data.lights.new('l', 'POINT' if t == 'POINT' else 'SPOT'); ld.color = (1, .82, .62); ld.energy = 25 if t == 'POINT' else 40; ld.shadow_soft_size = .05
    if t == 'SPOT': ld.spot_size = math.radians(100); ld.spot_blend = .8
    lo = bpy.data.objects.new('l', ld); sc.collection.objects.link(lo); lo.matrix_world = mw
# okno: światło nieba (portal)
for (cx, cz, w, h) in [(-5.52, 1.97, 3.9, 5.4), (-5.52, 6.9, 3.2, 2.4)]:
    ad = bpy.data.lights.new('portal', 'AREA'); ad.shape = 'RECTANGLE'; ad.size = w; ad.size_y = h; ad.cycles.is_portal = True
    ao = bpy.data.objects.new('portal', ad); sc.collection.objects.link(ao); ao.location = (cx - .06, -cz, h / 2 + (0 if cz < 3 else 0)); ao.rotation_euler = (math.radians(90), 0, math.radians(-90)); ao.rotation_euler = mathutils.Vector((1, 0, 0)).to_track_quat('-Z', 'Y').to_euler()

# światła AREA z obiektów-znaczników
for o in list(sc.objects):
    if o.type == 'EMPTY' and o.name.startswith('AREA'):
        parts = o.name.split(':')
        try: w_, d_, e_ = float(parts[1]), float(parts[2]), float(parts[3].split('.')[0])
        except Exception: continue
        ad = bpy.data.lights.new('a', 'AREA'); ad.shape = 'RECTANGLE'; ad.size = w_; ad.size_y = d_; ad.energy = e_ * 1.6; ad.color = (1, .9, .78)
        ao = bpy.data.objects.new('a', ad); sc.collection.objects.link(ao); ao.location = o.matrix_world.translation; ao.rotation_euler = (0, 0, 0)
# kamera
V = {'main': ((330, 525, 160), (330, 0), 41, 33), 'niche1': ((515, 120, 140), (0, 235), 30, 26), 'niche2': ((535, 240, 132), (0, 197), 28, 24)}
PANO = view.startswith('pano:')
if PANO:
    px, py, ph = map(float, view.split(':')[1].split(',')); lx, ly = px, py - 100; up, dn = 30, 30
    yaw = float(view.split(':')[2]) if view.count(':') > 1 else 0
else:
    vk = view if view == 'main' else ('niche1' if concept == '1' else 'niche2'); (px, py, ph), (lx, ly), up, dn = V[vk]
cd = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cd); sc.collection.objects.link(co); sc.camera = co
co.location = (-px / 100, -py / 100, ph / 100)
dx, dy = (-lx / 100) - co.location.x, (-ly / 100) - co.location.y
co.rotation_euler = (math.radians(90), 0, math.atan2(-dx, dy))
if PANO:
    co.rotation_euler = (math.radians(90), 0, math.radians(yaw))
    cd.type = 'PANO'
    try: cd.panorama_type = 'EQUIRECTANGULAR'
    except Exception: cd.cycles.panorama_type = 'EQUIRECTANGULAR'
tu, td = math.tan(math.radians(up)), math.tan(math.radians(dn))
if not PANO: cd.sensor_fit = 'VERTICAL'; cd.angle_y = 2 * math.atan((tu + td) / 2); cd.shift_y = ((tu - td) / 2 / (tu + td)) * H / max(W, H)
cd.clip_start = .05
# render
sc.render.engine = 'CYCLES'; cy = sc.cycles; cy.device = 'CPU'; cy.samples = samples; cy.use_denoising = True
try: cy.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
cy.max_bounces = 8; cy.diffuse_bounces = 4; cy.glossy_bounces = 3; cy.transmission_bounces = 6; cy.caustics_reflective = False; cy.caustics_refractive = False; cy.sample_clamp_indirect = 6
cy.use_adaptive_sampling = True
sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.resolution_percentage = 100
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast' if 'AgX - Medium High Contrast' in [x for x in ['AgX - Medium High Contrast']] else 'None'
sc.view_settings.exposure = float(argv[6]) if len(argv) > 6 else 0.0
sc.render.threads_mode = 'AUTO'
sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 92
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('DONE', out)
