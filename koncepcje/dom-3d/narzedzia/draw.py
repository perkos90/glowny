"""Mini rysownik: te same prymitywy -> SVG (raport) i DXF (cm)."""
import math, html
class D:
    def __init__(s, name): s.name=name; s.items=[]
    def add(s, kind, **kw): s.items.append((kind,kw)); return s
    def rect(s,x,y,w,h,fill='none',stroke='#222',sw=1,layer='K_MEBLE',pattern=None,dash=None,op=1,rx=0):
        return s.add('rect',x=x,y=y,w=w,h=h,fill=fill,stroke=stroke,sw=sw,layer=layer,pattern=pattern,dash=dash,op=op,rx=rx)
    def line(s,x1,y1,x2,y2,stroke='#222',sw=1,layer='K_MEBLE',dash=None):
        return s.add('line',x1=x1,y1=y1,x2=x2,y2=y2,stroke=stroke,sw=sw,layer=layer,dash=dash)
    def poly(s,pts,fill='none',stroke='#222',sw=1,layer='K_MEBLE',closed=True,dash=None,pattern=None,op=1):
        return s.add('poly',pts=pts,fill=fill,stroke=stroke,sw=sw,layer=layer,closed=closed,dash=dash,pattern=pattern,op=op)
    def circle(s,cx,cy,r,fill='none',stroke='#222',sw=1,layer='K_MEBLE',dash=None):
        return s.add('circle',cx=cx,cy=cy,r=r,fill=fill,stroke=stroke,sw=sw,layer=layer,dash=dash)
    def text(s,x,y,t,size=10,color='#333',anchor='middle',layer='K_OPIS',rot=0,weight='normal',italic=False):
        return s.add('text',x=x,y=y,t=t,size=size,color=color,anchor=anchor,layer=layer,rot=rot,weight=weight,italic=italic)
    def dim(s,x1,y1,x2,y2,off,label=None,layer='K_WYMIARY',size=9,color='#555'):
        dx,dy=x2-x1,y2-y1; L=math.hypot(dx,dy); nx,ny=-dy/L,dx/L
        a=(x1+nx*off,y1+ny*off); b=(x2+nx*off,y2+ny*off)
        s.line(x1,y1,a[0]+nx*4*(1 if off>0 else -1),a[1]+ny*4*(1 if off>0 else -1),color,0.5,layer)
        s.line(x2,y2,b[0]+nx*4*(1 if off>0 else -1),b[1]+ny*4*(1 if off>0 else -1),color,0.5,layer)
        s.line(*a,*b,color,0.6,layer)
        for p in (a,b):
            s.line(p[0]-3*(dx/L)-3*nx,p[1]-3*(dy/L)-3*ny,p[0]+3*(dx/L)+3*nx,p[1]+3*(dy/L)+3*ny,color,0.9,layer)
        lab = label if label is not None else f"{L:.0f}"
        mx,my=(a[0]+b[0])/2+nx*5*(1 if off>0 else -1),(a[1]+b[1])/2+ny*5*(1 if off>0 else -1)
        ang=math.degrees(math.atan2(dy,dx))
        if ang>90 or ang<=-90: ang-=180
        s.text(mx,my-size*0.35*(0 if abs(ang)<1 else 0),lab,size,color,'middle',layer,rot=ang)
        return s

    # ---------- SVG ----------
    def svg(s, bbox, scale=1.0, bg='#FBF8F3', defs='', pad=10, cls=''):
        x0,y0,x1,y1=bbox; W=(x1-x0)*scale+2*pad; H=(y1-y0)*scale+2*pad
        X=lambda x:(x-x0)*scale+pad; Y=lambda y:(y1-y)*scale+pad
        o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" class="{cls}" font-family="Jost, Helvetica, Arial, sans-serif">',defs,
           f'<rect x="0" y="0" width="{W:.0f}" height="{H:.0f}" fill="{bg}"/>']
        def st(kw,fillable=True):
            f=kw.get('fill','none') if fillable else 'none'
            if kw.get('pattern'): f=f"url(#{kw['pattern']})"
            r=f'fill="{f}" stroke="{kw["stroke"]}" stroke-width="{kw["sw"]*max(scale,0.6):.2f}"'
            if kw.get('dash'): r+=f' stroke-dasharray="{" ".join(str(d*scale) for d in kw["dash"])}"'
            if kw.get('op',1)!=1: r+=f' opacity="{kw["op"]}"'
            return r
        for k,kw in s.items:
            if k=='rect':
                x,y,w,h=kw['x'],kw['y'],kw['w'],kw['h']
                if w<0: x,w=x+w,-w
                if h<0: y,h=y+h,-h
                rx=f' rx="{kw["rx"]*scale:.1f}"' if kw['rx'] else ''
                if kw.get('pattern') and kw['fill']!='none':
                    o.append(f'<rect x="{X(x):.1f}" y="{Y(y+h):.1f}" width="{w*scale:.1f}" height="{h*scale:.1f}"{rx} fill="{kw["fill"]}" stroke="none"/>')
                o.append(f'<rect x="{X(x):.1f}" y="{Y(y+h):.1f}" width="{w*scale:.1f}" height="{h*scale:.1f}"{rx} {st(kw)}/>')
            elif k=='line':
                o.append(f'<line x1="{X(kw["x1"]):.1f}" y1="{Y(kw["y1"]):.1f}" x2="{X(kw["x2"]):.1f}" y2="{Y(kw["y2"]):.1f}" {st(kw,False)} stroke-linecap="round"/>')
            elif k=='poly':
                p=" ".join(f"{X(a):.1f},{Y(b):.1f}" for a,b in kw['pts'])
                tag='polygon' if kw['closed'] else 'polyline'
                if kw.get('pattern') and kw['fill']!='none':
                    o.append(f'<{tag} points="{p}" fill="{kw["fill"]}" stroke="none"/>')
                o.append(f'<{tag} points="{p}" {st(kw, kw["closed"])} stroke-linejoin="round"/>')
            elif k=='circle':
                o.append(f'<circle cx="{X(kw["cx"]):.1f}" cy="{Y(kw["cy"]):.1f}" r="{kw["r"]*scale:.1f}" {st(kw)}/>')
            elif k=='text':
                a={'middle':'middle','left':'start','right':'end'}[kw['anchor']]
                tr=f' transform="rotate({-kw["rot"]:.1f} {X(kw["x"]):.1f} {Y(kw["y"]):.1f})"' if kw['rot'] else ''
                it=' font-style="italic"' if kw['italic'] else ''
                o.append(f'<text x="{X(kw["x"]):.1f}" y="{Y(kw["y"]):.1f}" font-size="{kw["size"]*scale:.1f}" fill="{kw["color"]}" text-anchor="{a}" font-weight="{kw["weight"]}"{it} dominant-baseline="middle"{tr}>{html.escape(kw["t"])}</text>')
        o.append('</svg>'); return "\n".join(o)

    # ---------- DXF ----------
    def to_dxf(s, msp, dx=0, dy=0, doc=None):
        def lay(n):
            if n not in doc.layers: doc.layers.add(n, color=LAYER_COLORS.get(n,7))
            return n
        for k,kw in s.items:
            L=lay(kw['layer']); att={'layer':L}
            if kw.get('dash'): att['linetype']='DASHED'
            if k=='rect':
                x,y,w,h=kw['x']+dx,kw['y']+dy,kw['w'],kw['h']
                msp.add_lwpolyline([(x,y),(x+w,y),(x+w,y+h),(x,y+h)],close=True,dxfattribs=att)
            elif k=='line':
                msp.add_line((kw['x1']+dx,kw['y1']+dy),(kw['x2']+dx,kw['y2']+dy),dxfattribs=att)
            elif k=='poly':
                msp.add_lwpolyline([(a+dx,b+dy) for a,b in kw['pts']],close=kw['closed'],dxfattribs=att)
            elif k=='circle':
                msp.add_circle((kw['cx']+dx,kw['cy']+dy),kw['r'],dxfattribs=att)
            elif k=='text':
                al={'middle':'MIDDLE_CENTER','left':'MIDDLE_LEFT','right':'MIDDLE_RIGHT'}[kw['anchor']]
                t=msp.add_text(kw['t'],height=kw['size']*0.8,rotation=kw['rot'],dxfattribs={'layer':L,'style':'PL'})
                t.set_placement((kw['x']+dx,kw['y']+dy),align=__import__('ezdxf').enums.TextEntityAlignment[al])
LAYER_COLORS={'K_SCIANY':8,'K_KONSTR':1,'K_WNEKA':6,'K_OKNA':4,'K_MEBLE':7,'K_ZABUDOWA':30,'K_OPIS':5,'K_WYMIARY':3,
              'K_ELEKTRYKA':1,'K_SWIATLO':2,'K_TKANINY':9,'K_PRZEKROJ':8}
