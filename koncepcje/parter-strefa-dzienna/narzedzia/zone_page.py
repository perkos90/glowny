import json,re,sys
S='/tmp/claude-0/-home-user-glowny/ba013781-b718-51a0-bf53-95e01ff08717/scratchpad/'
scene=open('/tmp/viz/web/scene.js').read()
old="const Q = new URLSearchParams(window.__Q ?? location.search);"
assert old in scene
scene=scene.replace(old,"const Q = new URLSearchParams('i=1&zone=1&c=k2wp&cs=k2wp');")
zone=json.dumps(json.load(open('/tmp/viz/web/zone.json')),separators=(',',':'))
head=open('/tmp/viz/build/zone_head.html').read()
garden=open('/tmp/viz/web/garden.js').read()
out=head+"\n<script>window.__ZONE="+zone+";</script>\n<script>\n"+garden+"\n</script>\n<script type=\"module\">\n"+scene+"\n</script>\n"
open(S+'parter-strefa-dzienna.html','w').write(out); print(len(out))
