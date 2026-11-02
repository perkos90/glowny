import ezdxf, sys, json, numpy as np, collections
doc = ezdxf.readfile(sys.argv[1]); msp=doc.modelspace()
DX,DY=230617.694,17769.193
def pc(x,y):
    x,y=x-DX,y-DY
    if -1800<x<1000 and -300<y<1900: return 'g',x,y
    if -1800<x<1000 and -3300<y<-1300: return 'u',x,y+3000
    return None
out=collections.defaultdict(list)
for e in msp:
    t=e.dxftype(); L=e.dxf.layer
    if t=='INSERT' and L.startswith('IE_ośw'):
        r=pc(*list(e.dxf.insert)[:2])
        if r: out[e.dxf.name].append([r[0],round(r[1],1),round(r[2],1),round(e.dxf.rotation,1)])
    elif t=='CIRCLE' and L in('A_Więźba','PDF_Wentylacja','PDF__WENTYLACJA NAWIEW'):
        r=pc(*list(e.dxf.center)[:2])
        if r: out['C|'+L+'|'+str(round(e.dxf.radius,1))].append([r[0],round(r[1],1),round(r[2],1)])
    elif t=='LWPOLYLINE' and L=='A_Więźba' and e.dxf.get('color')==6:
        p=np.array(e.get_points('xy')); r=pc(*p.mean(0))
        if r: out['SPKBOX'].append([r[0],round(r[1],1),round(r[2],1),[round(v,1) for v in np.ptp(p,0)],len(p)])
for k,v in out.items():
    print(k,len(v))
    for i in v: print('   ',i)
json.dump(out,open('/tmp/dwgwork/sym.json','w'))
