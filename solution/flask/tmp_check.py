import json
import cbsodata

ds = '86165NED'
filters = "Codering_3 eq 'BU05991051'"
print('FILTER', filters)
data = cbsodata.get_data(ds, filters=filters)
print('COUNT', len(data))
print('FIRST', json.dumps(data[:2], indent=2)[:1600])
