"""thumb_sheet.py <dir>: contact sheet of thumb-1..3.jpg, big on top and 200 px previews below (how they look in a feed)."""
import sys
from PIL import Image
D = sys.argv[1]; ims = [Image.open(f'{D}/thumb-{v}.jpg') for v in (1, 2, 3)]; w, h = ims[0].size
big = min(520, w); sm = 200; bh = int(big * h / w); sh = int(sm * h / w)
S = Image.new('RGB', (3 * big + 40, bh + sh + 30), (20, 20, 24))
for i, im in enumerate(ims):
    S.paste(im.resize((big, bh)), (10 + i * (big + 10), 10)); S.paste(im.resize((sm, sh)), (10 + i * (big + 10), bh + 20))
S.save(f'{D}/sheet.jpg', quality=90); print('sheet', S.size)
