"""Optional weekly Yahoo fund metadata; never changes prices or chart data.

fundProfile.annualReportExpenseRatio is a fraction (0.0003 = 0.03%).
Only the fund's own expense field is used, never the category average.
Missing fields retain their last valid value, marked stale, independently.
"""
import argparse, json, math, sys, time
from pathlib import Path
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache/etf-metadata-runtime'
if (CACHE/'yfinance/__init__.py').is_file(): sys.path.insert(0,str(CACHE))

def raw(value):
    return value.get('raw') if isinstance(value, dict) else value

def valid_isin(value):
    import re
    if not isinstance(value,str) or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}[0-9]',value): return False
    digits=''.join(str(int(c,36)) if c.isalpha() else c for c in value)
    return sum((int(c)*2//10+int(c)*2%10) if n%2 else int(c) for n,c in enumerate(reversed(digits)))%10==0

def resolve_metadata(profile, previous, now, source_url):
    fees=profile.get('feesExpensesInvestment') or {}
    candidates={
        'provider': (profile.get('family'), 'fundProfile.family'),
        'annualFee': (raw(fees.get('annualReportExpenseRatio')), 'fundProfile.feesExpensesInvestment.annualReportExpenseRatio'),
        'isin': (profile.get('isin'), 'fundProfile.isin'),
    }
    result={}
    for key,(value,field) in candidates.items():
        valid=(isinstance(value,str) and bool(value.strip())) if key=='provider' else valid_isin(value) if key=='isin' else isinstance(value,(float,int)) and not isinstance(value,bool) and math.isfinite(value) and 0<=value<=.1
        if valid:
            result[key]={'value':value,'status':'reported','source':'Yahoo Finance','field':field,'sourceUrl':source_url,'collectedAt':now,'lastAttemptAt':now,'asOf':None}
            if key=='annualFee': result[key].update(kind='expense_ratio',unit='fraction_per_year')
        elif previous.get(key,{}).get('value') is not None:
            result[key]={**previous[key],'status':'stale','lastAttemptAt':now}
        else:
            result[key]={'value':None,'status':'unavailable','lastAttemptAt':now,'source':'Yahoo Finance','field':field,'sourceUrl':source_url}
    return result

def resolve_assets(detail, previous, now):
    value=detail.get('totalAssets')
    if isinstance(value,dict): value=value.get('raw')
    currency=detail.get('currency')
    valid=isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value) and value>0
    if valid and isinstance(currency,str) and len(currency)==3:
        return {'value':value,'currency':currency,'status':'reported','collectedAt':now,'lastAttemptAt':now,'asOf':None,'source':'Yahoo Finance summaryDetail','scope':'Fund/share-class scope not specified by Yahoo','methodology':'Yahoo-reported totalAssets and currency from summaryDetail; not independently reconciled with issuer. Collection date is not the assets reference date.'}
    if previous.get('value'):
        return {**previous,'status':'stale','lastAttemptAt':now}
    return {'value':None,'currency':None,'status':'unavailable','asOf':None,'lastAttemptAt':now,'source':'Yahoo Finance summaryDetail'}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--metadata-only',action='store_true',help='Refresh provider, expense ratio and explicit ISIN only; preserve net assets.')
    parser.add_argument('--force',action='store_true')
    parser.add_argument('--fixed-income',action='store_true',help='Refresh global fixed-income metadata only; preserve all other instruments.')
    args=parser.parse_args()
    import yfinance as yf
    path=ROOT/'data/etf-universe.json'
    data=json.loads(path.read_text(encoding='utf-8'))
    now=datetime.now(timezone.utc)
    pending=[]
    for item in data['instruments']:
        if args.fixed_income and (item.get('assetClass')!='fixed_income' or item.get('market')=='Brazil'): continue
        previous=item.get('fundAssets',{})
        try: due=now-datetime.fromisoformat(previous['lastAttemptAt'])>=timedelta(days=7)
        except (KeyError,ValueError,TypeError): due=True
        metadata_dates=[v.get('lastAttemptAt') for v in item.get('fundMetadata',{}).values() if isinstance(v,dict)]
        try: metadata_due=not metadata_dates or any(now-datetime.fromisoformat(d)>=timedelta(days=7) for d in metadata_dates)
        except (ValueError,TypeError): metadata_due=True
        if args.force or metadata_due or (due and not args.metadata_only): pending.append(item)
    def collect(item):
        previous=item.get('fundAssets',{})
        try:
            response=yf.Ticker(item['quoteSymbol'])._quote._fetch(['summaryDetail','fundProfile','quoteType'])
            payload=response['quoteSummary']['result'][0]
            if payload.get('quoteType',{}).get('symbol','').upper()!=item['quoteSymbol'].upper():
                raise ValueError('Yahoo returned a different or missing listing symbol')
            detail=payload.get('summaryDetail') or {}
            result=resolve_assets(detail,previous,now.isoformat())
            profile=payload.get('fundProfile') or {}
        except Exception as exc:
            result=resolve_assets({},previous,now.isoformat())
            result['error']=str(exc)[:180]
            profile={}
        result['sourceUrl']='https://finance.yahoo.com/quote/'+item['quoteSymbol']+'/'
        if not args.metadata_only: item['fundAssets']=result
        item['fundMetadata']=resolve_metadata(profile,item.get('fundMetadata',{}),now.isoformat(),result['sourceUrl'])
        time.sleep(.25)
    if not pending:
        print('Fund metadata is within the weekly refresh window.'); return
    with ThreadPoolExecutor(max_workers=3) as pool:
        for n,_ in enumerate(pool.map(collect,pending),1):
            if n%30==0: print(f'Fund metadata checked: {n}/{len(pending)}',flush=True)
    temp=path.with_suffix('.tmp')
    temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); temp.replace(path)
    from collections import Counter
    print(dict(Counter(x.get('fundAssets',{}).get('status') for x in data['instruments'])))
    for field in ('provider','annualFee','isin'):
        print(field,dict(Counter(x.get('fundMetadata',{}).get(field,{}).get('status','unavailable') for x in data['instruments'])))
if __name__=='__main__': main()
