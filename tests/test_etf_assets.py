import importlib.util
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('assets',Path(__file__).resolve().parents[1]/'scripts/update-etf-assets.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AssetTests(unittest.TestCase):
 def test_valid_retains_unknown_scope_and_date(self):
  r=m.resolve_assets({'totalAssets':1000,'currency':'USD'},{},'2026-10-10T00:00:00+00:00')
  self.assertEqual(r['value'],1000);self.assertIsNone(r['asOf']);self.assertEqual(r['status'],'reported')
 def test_bad_values_unavailable(self):
  for v in [None,0,-2,float('nan'),float('inf'),True]:
   self.assertIsNone(m.resolve_assets({'totalAssets':v,'currency':'USD'},{},'now')['value'])
  self.assertIsNone(m.resolve_assets({'totalAssets':1000},{},'now')['value'])
 def test_failure_keeps_previous_value_and_collection_date(self):
  old={'value':1000,'currency':'USD','collectedAt':'before','asOf':None}
  r=m.resolve_assets({},old,'now')
  self.assertEqual(r['value'],1000);self.assertEqual(r['collectedAt'],'before');self.assertEqual(r['status'],'stale')
if __name__=='__main__':unittest.main()
