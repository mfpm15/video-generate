"""check_deliverables.py <film-dir>: every finished film must have its deliverables. Exit 1 and list what is MISSING (used by build.sh, series.py and selftest)."""
import os, sys, json
D = os.path.abspath(sys.argv[1]); slug = os.path.basename(D); fin = os.path.join(D, 'final')
need = {f'{slug}.mp4': 'the video', 'thumbnail.jpg': 'thumbnail (9:16)', 'CAPTION.txt': 'caption + hashtags per platform (write films/<slug>/post.json, run system/py/make_post.py)', 'HASHTAGS.txt': 'hashtags', 'POST.md': 'posting pack', 'QA-REPORT.md': 'QA report', 'CREDITS': 'credits'}
miss = [f'{k} ({v})' for k, v in need.items() if not os.path.exists(os.path.join(fin, k))]
print('deliverables:', 'ALL PRESENT' if not miss else 'MISSING -> ' + '; '.join(miss)); sys.exit(1 if miss else 0)
