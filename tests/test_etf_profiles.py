"""Validate card calculations using the same JavaScript served to the browser."""
from pathlib import Path
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]

class EtfProfileTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which('node'), 'Node.js is required for frontend tests')
    def test_card_values_and_fallbacks(self):
        result = subprocess.run(['node', '--test', 'tests/etf-profile.test.js'], cwd=ROOT, capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
