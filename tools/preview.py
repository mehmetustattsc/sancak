import json,math,matplotlib,sys
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import RegularPolygon
COL={'mavi':'#2f6fd6','siyah':'#3a3a40','kirmizi':'#c8322f','sari':'#e0b322','turkuaz':'#1fa5a0','yesil':'#3c9a3c','bordo':'#8c2042','turuncu':'#e07b22','mor':'#7a3fb0','kahve':'#8a5a2b','buz':'#8fc8e8','n':'#b9b2a5'}
M=json.load(open('src/maps.json'))
fig,axs=plt.subplots(1,len(M),figsize=(9*len(M),11))
for ax,m in zip(axs,M):
  for c in m['cells']:
    q,r=c[0],c[1]; x=q*math.sqrt(3)+(math.sqrt(3)/2 if r%2 else 0); y=-r*1.5
    if c[2]==0: ax.add_patch(RegularPolygon((x,y),6,radius=1,fc='#2c5a7a',ec='#3d6d8f',lw=.5)); continue
    t,f,mt,lv,nm=c[2],c[3],c[4],c[5],c[6]
    ax.add_patch(RegularPolygon((x,y),6,radius=1,fc=COL[f],ec='#ffffff' if mt else '#00000044',lw=2 if mt else .5))
    if t==2: ax.text(x,y,'≋',ha='center',va='center',color='#f5e6a0',fontsize=14)
    if t==3: ax.text(x,y+.15,'■' if not c[7] else '★',ha='center',va='center',color='w',fontsize=13); ax.text(x,y-.5,nm,ha='center',fontsize=7,color='w')
    if t==4: ax.text(x,y+.15,'♜',ha='center',va='center',color='w',fontsize=14); ax.text(x,y-.5,nm,ha='center',fontsize=7,color='w')
  ax.set_aspect('equal');ax.autoscale();ax.set_title(m['name']);ax.set_facecolor('#1d3c55');ax.axis('off')
plt.tight_layout();plt.savefig(sys.argv[1] if len(sys.argv)>1 else '/tmp/claude-0/prev.png',dpi=55)
