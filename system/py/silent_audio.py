"""Create a measured-duration silent track only for an explicitly silent film."""
import json
from pathlib import Path
import sys
import numpy as np
import soundfile as sf

d = Path(sys.argv[1])
film = json.loads((d/'film.json').read_text(encoding='utf-8'))
if film.get('audio') is not False or film.get('narration') is not False:
    raise SystemExit('Silent mode requires explicit audio:false and narration:false')
duration = json.loads((d/'timeline.json').read_text(encoding='utf-8'))['dur']
sf.write(d/'out/mix.wav', np.zeros((round(duration*48000), 2), dtype=np.float32), 48000, subtype='PCM_16')
(d/'out/mix-report.json').write_text(json.dumps({'intentional_silence': True, 'duration': duration}), encoding='utf-8')
