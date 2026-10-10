"""Optional weekly Yahoo asset metadata; never changes ETF price data."""
import json, math, sys, time
from pathlib import Path
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache/aum-probe'
if CACHE.exists(): sys.path.insert(0,str(CACHE))

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
    import yfinance as yf
    path=ROOT/'data/etf-universe.json'
    data=json.loads(path.read_text(encoding='utf-8'))
    now=datetime.now(timezone.utc)
    pending=[]
    for item in data['instruments']:
        previous=item.get('fundAssets',{})
        try: due=now-datetime.fromisoformat(previous['lastAttemptAt'])>=timedelta(days=7)
        except (KeyError,ValueError,TypeError): due=True
        if due: pending.append(item)
    def collect(item):
        previous=item.get('fundAssets',{})
        try:
            response=yf.Ticker(item['quoteSymbol'])._quote._fetch(['summaryDetail'])
            detail=response['quoteSummary']['result'][0]['summaryDetail']
            result=resolve_assets(detail,previous,now.isoformat())
        except Exception as exc:
            result=resolve_assets({},previous,now.isoformat())
            result['error']=str(exc)[:180]
        result['sourceUrl']='https://finance.yahoo.com/quote/'+item['quoteSymbol']+'/'
        item['fundAssets']=result
        time.sleep(.25)
    if not pending:
        print('Asset metadata is within the weekly refresh window.'); return
    with ThreadPoolExecutor(max_workers=3) as pool:
        for n,_ in enumerate(pool.map(collect,pending),1):
            if n%30==0: print(f'Assets checked: {n}/{len(pending)}',flush=True)
    temp=path.with_suffix('.tmp')
    temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); temp.replace(path)
    from collections import Counter
    print(dict(Counter(x.get('fundAssets',{}).get('status') for x in data['instruments'])))
if __name__=='__main__': main()
