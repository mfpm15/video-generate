"""Finish this authored sample locally: legible labels, silent AAC, compatible MP4."""
import argparse,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('raw',type=Path);p.add_argument('output',type=Path);a=p.parse_args();root=Path(__file__).resolve().parent
raw=a.raw.resolve();out=a.output.resolve();out.parent.mkdir(parents=True,exist_ok=True)
v=next(x for x in json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(raw)],text=True))['streams'] if x['codec_type']=='video')
if (v.get('color_space'),v.get('color_range'))!=('bt709','tv'):raise SystemExit('Unexpected input matrix/range: inspect and convert actual colors first. Do not just relabel.')
font='fontfile=assets/Inter.ttf';ink='0x182322';paper='0xecebe5'
f=['delogo=x=720:y=244:w=235:h=44',f"drawtext={font}:text='STUDIO / 02':x=744:y=250:fontsize=28:fontcolor={ink}",'delogo=x=80:y=454:w=850:h=44',f"drawtext={font}:text='AI AGENT · DARI IDE KE AKSI':x=86:y=462:fontsize=28:fontcolor={ink}",f'drawbox=x=80:y=1250:w=385:h=50:color={ink}:t=fill']
for i,text in enumerate(['01 / TUJUAN','02 / RENCANA','03 / AKSI','04 / ARAH']):
 f.append(f"drawtext={font}:text='{text}':x=96:y=1261:fontsize=28:fontcolor=white:enable='gte(t,{i*3})*lt(t,{(i+1)*3})'")
f += ['format=yuv420p','setsar=1']
subprocess.run(['ffmpeg','-hide_banner','-v','warning','-y','-i',str(raw),'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-map','0:v:0','-map','1:a:0','-vf',','.join(f),'-c:v','libx264','-preset','slow','-crf','16','-threads','4','-profile:v','high','-level:v','4.1','-maxrate','18M','-bufsize','36M','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0','-c:a','aac','-b:a','128k','-ar','48000','-t','12','-movflags','+faststart',str(out)],cwd=root,check=True)
print(out)
