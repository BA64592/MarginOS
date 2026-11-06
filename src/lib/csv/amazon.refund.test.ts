import { parseAmazonTransactionCsv } from './amazon'
import { analyzeStore } from '../calc/analyze'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const csv = [
  'date/time,settlement id,type,order id,sku,description,quantity,marketplace,fulfillment,product sales,product sales tax,shipping credits,gift wrap credits,promotional rebates,selling fees,fba fees,other transaction fees,other,tax collection model',
  '"Oct 1, 2024 12:00:00 AM PDT",1,Order,O-1,SKU-A,Widget,2,Amazon.co.uk,Amazon,40.00,0,2.00,0,0,-6.00,-4.00,0,0,MarketplaceFacilitator',
  '"Oct 5, 2024 12:00:00 AM PDT",1,Refund,O-1,SKU-A,Widget,1,Amazon.co.uk,Amazon,-20.00,0,-1.00,0,0,3.00,0,0,0,MarketplaceFacilitator',
].join('\n')

const parsed = parseAmazonTransactionCsv(csv, 'GBP')
assert(parsed.errors.length === 0, `errors: ${parsed.errors.join('; ')}`)
assert(parsed.lines.length === 2, `expected 2 lines got ${parsed.lines.length}`)

const order = parsed.lines.find((l) => l.refundAmount === 0)!
const refund = parsed.lines.find((l) => l.refundAmount > 0)!
assert(order != null && refund != null, 'order + refund rows')
assert(order.lineValue === 40, `order lineValue ${order.lineValue}`)
assert(refund.lineValue === 0, `refund must not inflate revenue, got ${refund.lineValue}`)
assert(refund.refundAmount === 21, `refundAmount ${refund.refundAmount}`)

const result = analyzeStore({
  lines: parsed.lines,
  costs: [
    {
      sku: 'SKU-A',
      name: 'Widget',
      unitCost: 5,
      packagingCost: 0,
      shippingCostPerUnit: 0,
      returnCostPerReturnedUnit: 1,
      digital: false,
    },
  ],
  adSpendTotal: 0,
  overheadsForPeriod: 0,
  conversionFees: 0,
  currency: 'GBP',
  targetMarginPct: 20,
  feesComparable: true,
  feesExcessPp: 0,
})

const product = result.products.find((p) => p.sku === 'SKU-A')!
assert(product.unitsSold === 2, `unitsSold must ignore refund qty, got ${product.unitsSold}`)
assert(product.revenue === 42, `revenue = 40+2 shipping, got ${product.revenue}`)
assert(product.returnCost >= 21, `return cost includes refund, got ${product.returnCost}`)

// DE Bestellung
const de = [
  'Datum/Uhrzeit,Abrechnungsnummer,Typ,Bestellnummer,SKU,Beschreibung,Menge,marketplace,fulfillment,Umsätze,product sales tax,Versandgutschriften,gift wrap credits,promotional rebates,Verkaufsgebühren,fba fees,other transaction fees,other,tax collection model',
  '01.10.2024 12:00:00,1,Bestellung,O-DE,SKU-B,Ding,1,Amazon.de,Amazon,10.00,0,0,0,0,-1.50,0,0,0,',
].join('\n')
const deParsed = parseAmazonTransactionCsv(de, 'EUR')
assert(deParsed.lines.length === 1, `DE Bestellung parse got ${deParsed.lines.length}`)
assert(deParsed.lines[0].lineValue === 10, 'DE order lineValue')

console.log('amazon.refund.test.ts: all assertions passed')
