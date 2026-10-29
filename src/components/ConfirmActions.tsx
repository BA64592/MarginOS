import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Button, ConfirmDialog } from './ui'

/** Clear sample data control + confirmation (v16.3 E2). */
export function ClearSampleDataButton({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { usingSampleData, clearSampleData, costs, lines } = useApp()
  const [open, setOpen] = useState(false)
  if (!usingSampleData) return null

  const sampleOrders = lines.filter((l) => l.isSample).length
  const sampleCosts = costs.filter((c) => c.isSample).length

  return (
    <>
      <Button variant="secondary" size={size} onClick={() => setOpen(true)}>
        Clear sample data
      </Button>
      <ConfirmDialog
        open={open}
        title="Are you sure?"
        confirmLabel="Clear sample data"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          clearSampleData()
          setOpen(false)
        }}
      >
        <p>
          This removes the sample orders
          {sampleOrders ? ` (${sampleOrders} lines)` : ''} and sample costs
          {sampleCosts ? ` (${sampleCosts} products)` : ''}. Your own data is not affected.
        </p>
        <p>Loading or clearing sample data does not use a Free upload.</p>
      </ConfirmDialog>
    </>
  )
}

/** Start fresh control + confirmation in settings (v16.3 E3). */
export function StartFreshButton() {
  const {
    startFresh,
    lines,
    costs,
    ads,
    savedDatasets,
    scenarios,
    monthlyOverheads,
    plan,
  } = useApp()
  const [open, setOpen] = useState(false)

  const orderDatasets = lines.length > 0 ? 1 : 0
  const templateN = costs.filter((c) => !c.isSample).length || (costs.length ? 1 : 0)
  const adChannels = new Set(ads.map((a) => a.channel)).size
  const overheadN = monthlyOverheads > 0 ? 1 : 0

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Start fresh
      </Button>
      <ConfirmDialog
        open={open}
        title="Are you sure?"
        confirmLabel="Delete my shop data"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          startFresh()
          setOpen(false)
        }}
      >
        <p>This will permanently delete:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {orderDatasets} order dataset{orderDatasets === 1 ? '' : 's'}
            {plan === 'pro' && savedDatasets.length
              ? ` and ${savedDatasets.length} saved dataset${savedDatasets.length === 1 ? '' : 's'}`
              : ''}
          </li>
          <li>
            {templateN
              ? `${costs.length} cost row${costs.length === 1 ? '' : 's'} / template`
              : 'cost templates'}
          </li>
          <li>
            ad spend for {adChannels || 0} channel{adChannels === 1 ? '' : 's'}
          </li>
          <li>
            {overheadN ? `${overheadN} overhead figure` : 'overheads'}
            {scenarios.length
              ? `, ${scenarios.length} scenario${scenarios.length === 1 ? '' : 's'}`
              : ''}{' '}
            and calculator inputs
          </li>
          <li>any sample data still loaded</li>
        </ul>
        <p className="font-medium text-ink">
          Your account, sign-in, Pro licence and purchase history are kept. Home currency and tax
          settings stay the same.
        </p>
        <p className="font-semibold text-danger">This can&apos;t be undone.</p>
        <p className="text-xs">
          This does not delete your account. Account deletion is a separate setting and is not
          available from here.
        </p>
        <p className="text-xs">Start fresh does not restore Free uploads for today.</p>
      </ConfirmDialog>
    </>
  )
}
