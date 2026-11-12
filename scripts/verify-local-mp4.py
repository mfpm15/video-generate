"""Verify the encoded delivery, without external APIs. Does not judge art or acting."""
import argparse,json,subprocess,struct
from pathlib import Path

def run(args):
    return subprocess.run(args,capture_output=True,text=True,check=True)

def verify(path):
    data=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]).stdout)
    streams=data['streams'];video=next(s for s in streams if s['codec_type']=='video')
    issues=[]
    for field,value in {'codec_name':'h264','pix_fmt':'yuv420p','sample_aspect_ratio':'1:1','color_space':'bt709','color_transfer':'bt709','color_primaries':'bt709'}.items():
        if video.get(field)!=value:issues.append(f'{field}: expected {value}, got {video.get(field)}')
    if video.get('color_range')!='tv':issues.append('Video must use limited/tv range')
    if not any(s['codec_type']=='audio' and s['codec_name']=='aac' for s in streams):issues.append('Delivery needs AAC audio (silence is allowed)')
    decode=run(['ffmpeg','-v','error','-xerror','-i',str(path),'-f','null','-'])
    if decode.stderr.strip():issues.append(decode.stderr.strip())
    boxes=[]
    with path.open('rb') as f:
        while f.tell()<path.stat().st_size:
            start=f.tell();header=f.read(8)
            if len(header)<8:break
            size,kind=struct.unpack('>I4s',header)
            if size==1:size=struct.unpack('>Q',f.read(8))[0]
            if size==0:size=path.stat().st_size-start
            if size<8:raise ValueError('Invalid MP4 box size')
            boxes.append(kind.decode('ascii',errors='replace'));f.seek(start+size)
    if 'moov' not in boxes or 'mdat' not in boxes or boxes.index('moov')>boxes.index('mdat'):issues.append('MP4 is not faststart')
    return {'file':path.name,'status':'pass' if not issues else 'fail','duration_seconds':float(data['format']['duration']),'video':{k:video.get(k) for k in ['codec_name','profile','level','width','height','r_frame_rate','nb_frames','pix_fmt','sample_aspect_ratio','color_range','color_space','color_transfer','color_primaries']},'full_decode':'completed','faststart_boxes':boxes,'issues':issues,'scope':'Encoded file only. Visual/caption/action review and target laptop playback remain separate checks.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('video',type=Path);parser.add_argument('--report',type=Path);args=parser.parse_args()
    result=verify(args.video);output=json.dumps(result,indent=2,ensure_ascii=False)+'\n'
    if args.report:args.report.write_text(output,encoding='utf-8')
    print(output);raise SystemExit(0 if result['status']=='pass' else 1)
