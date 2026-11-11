import json
from pathlib import Path
d=Path(__file__).resolve().parent
starts=[0,3.2,6.8,10.4,14,18]
lines=json.loads((d/'lines.json').read_text())
scenes=[dict(id=x['id'],t0=starts[i],t1=starts[i+1],scene=x['scene']) for i,x in enumerate(lines)]
cues=[]; words=[]
for i,line in enumerate(lines):
 a=starts[i]+.12;b=starts[i+1]-.12;tokens=line['caption'].split()
 cues.append(dict(id=line['id'],t0=a,t1=b,text=line['caption'],timing_source='authored_visual_not_speech'))
 words.append(dict(id=line['id'],t0=a,t1=b,text=line['caption'],words=[dict(w=w,t0=a+k*.4,t1=a+(k+1)*.4) for k,w in enumerate(tokens)]))
(d/'timeline.json').write_text(json.dumps(dict(dur=18,fps=24,voice=[],visual_words=words,cues=cues,scenes=scenes,silences=[[0,18]]),indent=2))
