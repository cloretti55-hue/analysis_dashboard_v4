import importlib.util
import unittest
import contextlib
import io
import json
import sys
import tempfile
import types
from unittest.mock import patch
from pathlib import Path
spec=importlib.util.spec_from_file_location('assets',Path(__file__).resolve().parents[1]/'scripts/update-etf-assets.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AssetTests(unittest.TestCase):
 def test_refresh_preserves_verified_reference_on_success_and_failure(self):
  reference={'provider':{'value':'Verified issuer','status':'verified','cadence':'event_driven','verifiedAt':'2026-10-22','sourceUrl':'https://issuer.example/fund','quoteSymbol':'TEST'},'isin':{'value':'US9229083632'}}
  for failure in (False,True):
   with self.subTest(failure=failure), tempfile.TemporaryDirectory() as folder:
    root=Path(folder);(root/'data').mkdir()
    path=root/'data/etf-universe.json'
    previous_assets={'value':1000,'currency':'USD','collectedAt':'2026-01-01'}
    path.write_text(json.dumps({'instruments':[{'ticker':'TEST','quoteSymbol':'TEST','fundReference':reference,'fundAssets':previous_assets}]}),encoding='utf-8')
    def fetch(modules):
     if failure: raise RuntimeError('Simulated provider outage')
     return {'quoteSummary':{'result':[{'quoteType':{'symbol':'TEST'},'fundProfile':{'family':'Yahoo changed family'},'summaryDetail':{'totalAssets':2000,'currency':'USD'}}]}}
    fake=types.SimpleNamespace(Ticker=lambda symbol:types.SimpleNamespace(_quote=types.SimpleNamespace(_fetch=fetch)))
    with patch.object(m,'ROOT',root), patch.object(m.time,'sleep'), patch.dict(sys.modules,{'yfinance':fake}), patch.object(sys,'argv',['update-etf-assets.py','--force']), contextlib.redirect_stdout(io.StringIO()):
     m.main()
    updated=json.loads(path.read_text(encoding='utf-8'))['instruments'][0]
    self.assertEqual(updated['fundReference'],reference)
    self.assertEqual(updated['fundAssets']['status'],'stale' if failure else 'reported')
    if not failure:self.assertEqual(updated['fundMetadata']['provider']['value'],'Yahoo changed family')
 def test_profile_uses_fund_expense_not_category_average(self):
  p={'family':'Vanguard','feesExpensesInvestment':{'annualReportExpenseRatio':.0003},'feesExpensesInvestmentCat':{'annualReportExpenseRatio':.1}}
  r=m.resolve_metadata(p,{},'today','https://finance.yahoo.com/quote/VOO/')
  self.assertEqual(r['annualFee']['value'],.0003)
  self.assertEqual(r['annualFee']['unit'],'fraction_per_year')
  self.assertEqual(r['annualFee']['kind'],'expense_ratio')
  self.assertNotIn('managementFee',r)
 def test_metadata_failure_preserves_each_fields_date_independently(self):
  old={'provider':{'value':'Issuer','collectedAt':'before'},'annualFee':{'value':0,'collectedAt':'earlier','unit':'fraction_per_year','kind':'expense_ratio'}}
  r=m.resolve_metadata({},old,'now','https://finance.yahoo.com/')
  self.assertEqual(r['annualFee']['value'],0)
  self.assertEqual(r['annualFee']['collectedAt'],'earlier')
  self.assertEqual(r['annualFee']['status'],'stale')
  self.assertEqual(r['provider']['collectedAt'],'before')
 def test_expense_rejects_invalid_and_untyped_values(self):
  for value in [True,-1,float('nan'),float('inf'),'0.03',None,.5]:
   r=m.resolve_metadata({'feesExpensesInvestment':{'annualReportExpenseRatio':value}}, {},'now','https://finance.yahoo.com/')
   self.assertIsNone(r['annualFee']['value'])
 def test_explicit_isin_has_checksum_and_no_synthetic_identifier(self):
  self.assertTrue(m.valid_isin('US9229083632'))
  for value in ['VOO','US9229083633',None]:self.assertFalse(m.valid_isin(value))
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
