import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/publish-data.py'


class PublishDataTests(unittest.TestCase):
    def git(self, cwd, *args):
        return subprocess.run(['git', *args], cwd=cwd, check=True, capture_output=True, text=True).stdout

    def setup_repo(self, root):
        remote, a, b = root/'remote.git', root/'a', root/'b'
        self.git(root, 'init', '--bare', str(remote))
        self.git(root, 'clone', str(remote), str(a))
        self.git(a, 'checkout', '-b', 'main')
        self.git(a, 'config', 'user.name', 'test')
        self.git(a, 'config', 'user.email', 'test@example.invalid')
        (a/'data').mkdir(); (a/'scripts').mkdir()
        (a/'scripts/validate-data.py').write_text('import json\nfrom pathlib import Path\np=Path("data")\n(p/"manifest.json").write_text(json.dumps({f.stem: json.loads(f.read_text()) for f in sorted(p.glob("*.json")) if f.name != "manifest.json"}))\n')
        for name in ('a', 'b'): (a/f'data/{name}.json').write_text('0')
        (a/'data/manifest.json').write_text('{"a": 0, "b": 0}')
        self.git(a, 'add', '.'); self.git(a, 'commit', '-m', 'initial')
        self.git(a, 'push', '-u', 'origin', 'main')
        self.git(root, 'clone', '-b', 'main', str(remote), str(b))
        self.git(b, 'config', 'user.name', 'test'); self.git(b, 'config', 'user.email', 'test@example.invalid')
        return a, b

    def concurrent_update(self, b, name):
        (b/f'data/{name}.json').write_text('2')
        subprocess.run([sys.executable, 'scripts/validate-data.py'], cwd=b, check=True)
        self.git(b, 'add', '.'); self.git(b, 'commit', '-m', 'concurrent'); self.git(b, 'push')

    def test_manifest_conflict_is_rebuilt_and_both_datasets_survive(self):
        with tempfile.TemporaryDirectory() as tmp:
            a, b = self.setup_repo(Path(tmp))
            (a/'data/a.json').write_text('1')
            self.concurrent_update(b, 'b')
            result = subprocess.run([sys.executable, str(SCRIPT), '--message', 'update a', 'data/a.json'], cwd=a, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.git(b, 'pull', '--ff-only')
            self.assertEqual(json.loads((b/'data/manifest.json').read_text()), {'a': 1, 'b': 2})
            self.assertEqual((b/'data/a.json').read_text(), '1')
            self.assertEqual((b/'data/b.json').read_text(), '2')

    def test_real_dataset_conflict_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            a, b = self.setup_repo(Path(tmp))
            (a/'data/a.json').write_text('1')
            self.concurrent_update(b, 'a')
            before = self.git(b, 'rev-parse', 'HEAD')
            result = subprocess.run([sys.executable, str(SCRIPT), '--message', 'update a', 'data/a.json'], cwd=a, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Concurrent change outside', result.stderr)
            self.git(b, 'fetch')
            self.assertEqual(self.git(b, 'rev-parse', 'origin/main'), before)
            self.assertFalse((a/'.git/rebase-merge').exists())
