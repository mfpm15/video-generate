"""Regression tests for incomplete builds, stale QA, scaffold selection and failed batch jobs."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'system/py'))
import check_deliverables
import check_inputs
import run_qa


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value), encoding='utf-8')


class ProductionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='video test ')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.film = self.root / 'films/test-film'
        self.film.mkdir(parents=True)
        write_json(self.film/'film.json', {'slug': 'test-film', 'title': 'Test', 'size': '1080x1920', 'fps': 30, 'render': 'template'})
        write_json(self.film/'lines.json', [{'id': 'v1', 'text': 'Test one'}, {'id': 'v2', 'text': 'Test two'}])
        write_json(self.film/'post.json', {'title': 'Test', 'caption': 'Test caption', 'hashtags': ['#test']})
        write_json(self.film/'timeline.json', {'dur': 3, 'cues': []})
        (self.film/'main.js').write_text("import './_lib/e3d.js';\n")

    def complete(self):
        final = self.film/'final'; final.mkdir(exist_ok=True)
        for name in ['test-film.mp4', 'thumbnail.jpg', 'CAPTION.txt', 'HASHTAGS.txt', 'POST.md', 'QA-REPORT.md', 'CREDITS']:
            (final/name).write_bytes(b'test artifact')
        qa = {'schema': 1, 'overall': 'LIMITED', 'video_sha256': run_qa.fingerprint(final/'test-film.mp4'),
              'source_sha256': {n: run_qa.fingerprint(self.film/n) for n in ('film.json', 'lines.json', 'timeline.json', 'main.js')},
              'checks': [{'name': 'fixture measurement', 'status': 'VERIFIED', 'detail': 'fixture'},
                         {'name': 'visual review', 'status': 'NOT TESTED', 'detail': 'not reviewed'}]}
        write_json(final/'QA-RESULTS.json', qa)
        return qa

    def test_mp4_alone_is_not_a_completed_build(self):
        (self.film/'final').mkdir(); (self.film/'final/test-film.mp4').write_bytes(b'partial video')
        self.assertTrue(check_deliverables.check(self.film))

    def test_complete_measured_build_retains_unverified_review_status(self):
        self.complete()
        self.assertEqual(check_deliverables.check(self.film), [])
        self.assertEqual(json.loads((self.film/'final/QA-RESULTS.json').read_text())['overall'], 'LIMITED')

    def test_failed_qa_blocks_delivery_even_with_all_files_present(self):
        qa = self.complete(); qa['checks'][0]['status'] = 'FAILED'
        write_json(self.film/'final/QA-RESULTS.json', qa)
        self.assertTrue(check_deliverables.check(self.film))

    def test_replaced_video_invalidates_old_qa(self):
        self.complete(); (self.film/'final/test-film.mp4').write_bytes(b'different video')
        self.assertIn('QA is stale: final video bytes changed', check_deliverables.check(self.film))

    def test_changed_renderer_or_style_invalidates_old_qa(self):
        self.complete(); (self.film/'main.js').write_text('new renderer')
        self.assertIn('QA is stale: main.js changed', check_deliverables.check(self.film))

    def test_empty_deliverable_blocks_delivery(self):
        self.complete(); (self.film/'final/CAPTION.txt').write_text('')
        self.assertIn('Missing/empty: CAPTION.txt', check_deliverables.check(self.film))

    def test_custom_mode_cannot_render_an_unchanged_template(self):
        self.assertEqual(check_inputs.check(self.film), [])
        f = json.loads((self.film/'film.json').read_text()); f['render'] = 'custom'
        write_json(self.film/'film.json', f)
        self.assertTrue(any('unchanged template' in e for e in check_inputs.check(self.film)))
        (self.film/'main.js').write_text('window.render = t => drawMyScene(t);')
        self.assertEqual(check_inputs.check(self.film), [])

    def test_missing_post_and_scaffold_script_are_rejected(self):
        (self.film/'post.json').unlink()
        self.assertTrue(check_inputs.check(self.film))
        write_json(self.film/'post.json', {'title': 'T', 'caption': 'C', 'hashtags': ['#a']})
        write_json(self.film/'lines.json', [{'id': 'v1', 'text': 'Stub'}])
        self.assertTrue(check_inputs.check(self.film))

    def test_silence_must_be_explicit_and_must_not_generate_then_discard_speech(self):
        film = json.loads((self.film/'film.json').read_text())
        film['audio'] = False
        write_json(self.film/'film.json', film)
        self.assertTrue(any('narration:false' in e for e in check_inputs.check(self.film)))
        film['narration'] = False
        write_json(self.film/'film.json', film)
        self.assertEqual(check_inputs.check(self.film), [])

    def test_silent_qa_skips_asr_but_still_requires_measured_content_bounds(self):
        self.complete()
        film = json.loads((self.film/'film.json').read_text()); film.update(audio=False, narration=False)
        write_json(self.film/'film.json', film)
        calls = []
        def tool(command, **kwargs):
            command = list(map(str, command)); calls.append(command)
            out = ''
            if command[0] == 'ffprobe':
                out = json.dumps({'streams': [{'codec_type': 'video', 'codec_name': 'h264', 'pix_fmt': 'yuv420p', 'width': 1080,
                                              'height': 1920, 'avg_frame_rate': '30/1'}, {'codec_type': 'audio', 'codec_name': 'aac'}],
                                  'format': {'duration': 3}})
            elif 'ebur128=peak=true' in command:
                out = 'I: -70.0 LUFS\nPeak: -inf dBFS'
            elif any('readcheck.mjs' in x for x in command):
                out = 'OK title measured readable text'
            elif any('qa-captions.mjs' in x for x in command):
                write_json(self.film/'out/qa-captions.json', {'mode': 'content-only', 'samples': 10, 'noBox': 0,
                           'outsideSafe': [], 'outsideContentSafe': [], 'overlaps': [], 'perCue': [{'samples': 10}]})
            return subprocess.CompletedProcess(command, 0, out, '')
        with patch.object(sys, 'argv', ['run_qa.py', str(self.film)]), patch.object(run_qa.subprocess, 'run', side_effect=tool), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(run_qa.main(), 0)
        qa = json.loads((self.film/'final/QA-RESULTS.json').read_text())
        self.assertFalse(any('qa_asr.py' in ' '.join(c) for c in calls))
        self.assertTrue(any(c['name'] == 'Critical text / brand safe area' and c['status'] == 'VERIFIED' for c in qa['checks']))
        self.assertTrue(any(c['status'] == 'NOT APPLICABLE' for c in qa['checks']))

    def test_no_measurements_are_never_passed(self):
        self.assertFalse(run_qa.assess_loudness('nothing')[0])
        self.assertFalse(run_qa.assess_loudness('I: -inf LUFS\nPeak: -inf dBFS')[0])
        self.assertFalse(run_qa.assess_captions({'samples': 0, 'noBox': 0})[0])
        self.assertFalse(run_qa.assess_captions({'samples': 3, 'noBox': 2, 'perCue': [{'samples': 3}]})[0])

    def test_actual_format_must_match_the_requested_format(self):
        probe = {'streams': [{'codec_type': 'video', 'codec_name': 'h264', 'pix_fmt': 'yuv420p', 'width': 1080, 'height': 1920, 'avg_frame_rate': '30/1'},
                             {'codec_type': 'audio', 'codec_name': 'aac'}], 'format': {'duration': '3.0'}}
        f = {'size': '1080x1920', 'fps': 30}
        self.assertTrue(run_qa.assess_format(probe, f, {'dur': 3})[0])
        f['size'] = '1920x1080'
        self.assertFalse(run_qa.assess_format(probe, f, {'dur': 3})[0])

    def test_real_ffmpeg_probe_and_loudness_are_parsed(self):
        video = self.root/'measured.mp4'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=320x180:r=30:d=3',
                        '-f', 'lavfi', '-i', 'sine=frequency=700:sample_rate=44100:duration=3',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-t', '3', str(video)], check=True)
        probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(video)]))
        self.assertTrue(run_qa.assess_format(probe, {'size': '320x180', 'fps': 30}, {'dur': 3})[0])
        meter = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(video), '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-'],
                               capture_output=True, text=True, check=True)
        _, measurements = run_qa.assess_loudness(meter.stdout + meter.stderr)
        self.assertIn('integrated_lufs', measurements)
        self.assertIn('true_peak_dbfs', measurements)
        self.assertFalse(run_qa.assess_format(probe, {'size': '1080x1920', 'fps': 30}, {'dur': 3})[0])

    def test_tool_failures_propagate_and_stale_caption_evidence_is_removed(self):
        self.complete(); write_json(self.film/'out/qa-captions.json', {'samples': 100, 'noBox': 0, 'perCue': [{'samples': 100}]})
        failure = subprocess.CompletedProcess(['fixture tool'], 9, '', 'intentional fixture failure')
        with patch.object(sys, 'argv', ['run_qa.py', str(self.film)]), patch.object(run_qa.subprocess, 'run', return_value=failure), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(run_qa.main(), 1)
        results = json.loads((self.film/'final/QA-RESULTS.json').read_text())
        self.assertEqual(results['overall'], 'FAILED')
        self.assertFalse((self.film/'out/qa-captions.json').exists())
        self.assertFalse(any(c['status'] == 'VERIFIED' for c in results['checks']))

    def scaffold_repo(self):
        for name in ['system/new-film.sh', 'system/build.sh', 'system/tools/runtime.sh', 'system/py/check_inputs.py', 'system/py/art_director.py', 'system/styles-catalog.json']:
            p = self.root/name; p.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(ROOT/name, p)
        shutil.copytree(ROOT/'system/template', self.root/'system/template')

    def test_explicit_style_palette_survives_scaffold_and_path_with_spaces(self):
        self.scaffold_repo()
        env = {**os.environ, 'LIB': str(self.root/'missing library'), 'VIDEO_PYTHON': sys.executable}
        r = subprocess.run(['sh', str(self.root/'system/new-film.sh'), 'Laut dan ikan', '--slug', 'ocean', '--style', 'dark-keynote'], env=env, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        f = json.loads((self.root/'films/ocean/film.json').read_text())
        style = next(x for x in json.loads((ROOT/'system/styles-catalog.json').read_text()) if x['slug'] == 'dark-keynote')
        self.assertEqual(f['palette'], style['palette'])
        self.assertEqual(f['fps'], style['style_fps'])
        r = subprocess.run(['sh', str(self.root/'system/new-film.sh'), 'Title', '--slug', '../escape'], env=env, capture_output=True, text=True)
        self.assertNotEqual(r.returncode, 0)
        self.assertFalse((self.root/'escape').exists())

    def test_custom_scaffold_retains_the_freeform_request(self):
        self.scaffold_repo()
        r = subprocess.run(['sh', str(self.root/'system/new-film.sh'), 'A new story', '--render', 'custom', '--requested-style', 'pastel ink, slow camera'],
                           env={**os.environ, 'VIDEO_PYTHON': sys.executable}, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        f = json.loads((self.root/'films/a-new-story/film.json').read_text())
        self.assertEqual((f['render'], f['requested_style']), ('custom', 'pastel ink, slow camera'))

    def test_last_scene_is_not_cut_before_its_text_can_be_read(self):
        write_json(self.film/'film.json', {'fps': 30, 'engine': '2d'})
        write_json(self.film/'lines.json', [{'id': 'v1', 'text': 'First', 'scene': {'head': 'First'}},
                                          {'id': 'v2', 'text': 'Second', 'scene': {'head': 'This final sentence needs a real reading hold, not just the short voice duration'}}])
        write_json(self.film/'voice/dur.json', {'v1': 1, 'v2': 1})
        write_json(self.film/'voice/words.json', {})
        r = subprocess.run([sys.executable, str(ROOT/'system/py/make_timeline.py'), str(self.film)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        tl = json.loads((self.film/'timeline.json').read_text())
        self.assertGreater(tl['scenes'][-1]['t1'] - tl['scenes'][-1]['t0'], 5)

    def test_visual_timeline_needs_no_fake_voice_files(self):
        write_json(self.film/'film.json', {'fps': 24, 'engine': '2d', 'narration': False, 'audio': False, 'duration': 12})
        r = subprocess.run([sys.executable, str(ROOT/'system/py/make_timeline.py'), str(self.film)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        timeline = json.loads((self.film/'timeline.json').read_text())
        self.assertEqual(timeline['dur'], 12)
        self.assertEqual(timeline['voice'], [])
        self.assertEqual(timeline['cues'], [])
        self.assertEqual(len(timeline['scenes']), 2)
        self.assertFalse((self.film/'voice').exists())

    def test_silent_visual_captions_have_authored_timing_not_fake_speech(self):
        write_json(self.film/'film.json', {'fps': 24, 'engine': '2d', 'narration': False, 'audio': False,
                                         'captions_required': True, 'caption': '01', 'duration': 12})
        r = subprocess.run([sys.executable, str(ROOT/'system/py/make_timeline.py'), str(self.film)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        timeline = json.loads((self.film/'timeline.json').read_text())
        self.assertEqual(timeline['voice'], [])
        self.assertEqual(len(timeline['cues']), 2)
        self.assertEqual(len(timeline['visual_words']), 2)
        self.assertTrue(all(c['timing_source'] == 'authored_visual_not_speech' for c in timeline['cues']))
        self.assertTrue(all(v['words'] for v in timeline['visual_words']))
        self.assertFalse((self.film/'voice').exists())

    def test_series_does_not_skip_or_accept_a_partial_mp4(self):
        spec = importlib.util.spec_from_file_location('series_runner', ROOT/'system/series.py')
        series = importlib.util.module_from_spec(spec); spec.loader.exec_module(series)
        # Reuse this fixture tree but adopt the runner's normal per-part slug.
        fd = self.root/'films/test-p01'; self.film.rename(fd)
        (fd/'final').mkdir(); (fd/'final/test-p01.mp4').write_bytes(b'leftover partial mp4')
        write_json(self.root/'series/test/series.json', {'title': 'Test', 'style': 'AUTO', 'size': '1080x1920', 'total': 1,
                   'parts': [{'n': 1, 'slug': 'test-p01', 'title': 'Part one', 'status': 'built'}]})
        write_json(self.root/'series/test/pronunciation.json', {})
        class Args:
            slug = 'test'; only = None; frm = None; force = False
        with patch.object(series, 'ROOT', str(self.root)), patch.object(series, 'sh', return_value=1) as shell, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(series.build(Args()), 1)
            self.assertEqual(shell.call_count, 2)
        self.assertEqual(json.loads((self.root/'series/test/series.json').read_text())['parts'][0]['status'], 'FAILED')
        # A later resume can reuse validated outputs and restore a stale series status.
        with patch.object(series, 'ROOT', str(self.root)), patch.object(series, 'delivery_errors', return_value=[]), patch.object(series, 'sh') as shell, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(series.build(Args()), 0)
            shell.assert_not_called()
        self.assertEqual(json.loads((self.root/'series/test/series.json').read_text())['parts'][0]['status'], 'built')


if __name__ == '__main__':
    unittest.main()
