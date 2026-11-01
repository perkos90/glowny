import json, math
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle
L=json.load(open('/tmp/dwgwork/gf_layers.json'))
walls=[p for k in ('A_\\U+015Aciana murowana','A_\\U+017Belbet','A_Ocieplenie') for p in L[k] if len(p)>3]
st=[p for p in L['A_Stolarka'] if len(p)>=2]
# bbox per polyline
bbs=[(min(a for a,b in p),min(b for a,b in p),max(a for a,b in p),max(b for a,b in p)) for p in st]
# cluster by proximity (gap < 35 cm)
n=len(bbs); par=list(range(n))
def f(i):
    while par[i]!=i: par[i]=par[par[i]]; i=par[i]
    return i
def near(a,b,g=35): return not(a[2]+g<b[0] or b[2]+g<a[0] or a[3]+g<b[1] or b[3]+g<a[1])
for i in range(n):
    for j in range(i+1,n):
        if near(bbs[i],bbs[j]): par[f(i)]=f(j)
cl={}
for i in range(n): cl.setdefault(f(i),[]).append(bbs[i])
ops=[]
for k,v in cl.items():
    x0=min(b[0] for b in v); y0=min(b[1] for b in v); x1=max(b[2] for b in v); y1=max(b[3] for b in v)
    w,h=x1-x0,y1-y0
    if max(w,h)<40: continue
    ops.append(dict(x0=round(x0),y0=round(y0),x1=round(x1),y1=round(y1),n=len(v)))
ops.sort(key=lambda o:(o['y0'],o['x0']))
for i,o in enumerate(ops): o['id']=i; print(i,o)
json.dump(ops,open('/tmp/dwgwork/openings.json','w'))
fig,ax=plt.subplots(figsize=(16,13))
for p in walls: ax.add_patch(Polygon(p,closed=True,fc='#8a7a6a',ec='none'))
for o in ops:
    ax.add_patch(Rectangle((o['x0'],o['y0']),o['x1']-o['x0'],o['y1']-o['y0'],fc='none',ec='r',lw=1)); ax.text(o['x1']+5,o['y1']+5,str(o['id']),color='r',fontsize=8)
ax.set_xlim(-1650,700); ax.set_ylim(-100,1800); ax.set_aspect('equal'); ax.grid(True,lw=.3)
fig.savefig('/tmp/dwgwork/openings.png',dpi=80,bbox_inches='tight')
