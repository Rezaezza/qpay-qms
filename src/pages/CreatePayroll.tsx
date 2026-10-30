import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { toast } from 'sonner'
import { Plus, Trash2, Users, ChevronDown } from 'lucide-react'
import { useWaitForTransactionReceipt } from 'wagmi'
import { useBatchCreatePayroll } from '../hooks/usePayrollContract'
import { parseOnchainError } from '../lib/utils'
import { TokenIcon } from '../components/TokenIcon'
import { Q } from '../theme'

interface CreatePayrollProps { onNavigate: (p: string) => void }

interface EmployeeRow {
  id:          number
  name:        string
  wallet:      string
  amount:      string
  tokenSymbol: 'USDT' | 'USDC'
  startDate:   string
}

function makeRow(id: number): EmployeeRow {
  const today = new Date().toISOString().split('T')[0]
  return { id, name: '', wallet: '', amount: '', tokenSymbol: 'USDT', startDate: today }
}

const input = {
  width: '100%', background: Q.surf, border: `1px solid ${Q.border}`,
  borderRadius: 10, color: Q.ink, fontSize: 14, padding: '10px 12px',
  outline: 'none', boxSizing: 'border-box' as const,
}
const label = { color: Q.muted, fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' as const }
const card  = { background: Q.surf2, border: `1px solid ${Q.border}`, borderRadius: 16 }

function rowError(r: EmployeeRow) {
  if (!r.name.trim())                   return 'Name required'
  if (!isAddress(r.wallet))             return 'Invalid wallet address'
  if (!r.amount || isNaN(Number(r.amount)) || Number(r.amount) <= 0) return 'Amount must be > 0'
  if (!r.startDate)                     return 'Start date required'
  return null
}

export function CreatePayroll({ onNavigate }: CreatePayrollProps) {
  const { isConnected } = useAccount()
  const [rows, setRows]   = useState<EmployeeRow[]>([makeRow(1)])
  const [nextId, setNextId] = useState(2)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { batchCreatePayroll, isPending } = useBatchCreatePayroll()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const isSubmitting = isPending || isConfirming

  // Navigate away after confirmed
  if (isConfirmed && txHash) {
    toast.success(`${rows.length} payroll ${rows.length === 1 ? 'entry' : 'entries'} created!`)
    onNavigate('payroll')
  }

  function addRow() {
    if (rows.length >= 20) { toast.error('Max 20 employees per batch'); return }
    setRows(prev => [...prev, makeRow(nextId)])
    setNextId(n => n + 1)
  }

  function removeRow(id: number) {
    if (rows.length === 1) return
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function updateRow(id: number, field: keyof EmployeeRow, value: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function toggleToken(id: number) {
    setRows(prev => prev.map(r => r.id === id
      ? { ...r, tokenSymbol: r.tokenSymbol === 'USDT' ? 'USDC' : 'USDT' }
      : r
    ))
  }

  const errors = rows.map(rowError)
  const hasErrors = errors.some(e => e !== null)
  const canSubmit = isConnected && !hasErrors && !isSubmitting

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    try {
      const entries = rows.map(r => ({
        employeeName: r.name.trim(),
        employee:     r.wallet as `0x${string}`,
        amountHuman:  r.amount,
        tokenSymbol:  r.tokenSymbol,
        startDate:    new Date(r.startDate + 'T00:00:00'),
      }))
      const hash = await batchCreatePayroll(entries)
      setTxHash(hash)
    } catch (err) {
      toast.error(parseOnchainError(err))
    }
  }, [canSubmit, rows, batchCreatePayroll])

  // Button label
  const btnLabel = isPending
    ? '⟳ Waiting for signature…'
    : isConfirming
      ? '⟳ Confirming on blockchain…'
      : rows.length === 1
        ? 'Create Payroll Entry'
        : `Create ${rows.length} Payroll Entries`

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: Q.accDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} style={{ color: Q.acc }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", margin: 0, fontSize: 22, fontWeight: 700, color: Q.ink, letterSpacing: '-0.02em' }}>
              Create Payroll
            </h1>
            <p style={{ margin: 0, color: Q.muted, fontSize: 13 }}>
              {rows.length === 1 ? '1 employee' : `${rows.length} employees`} · 1 transaction
            </p>
          </div>
        </div>
        <button onClick={addRow} disabled={isSubmitting || rows.length >= 20}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: Q.accDim, border: `1px solid ${Q.border2}`,
            borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
            color: Q.acc, fontSize: 13, fontWeight: 600,
            opacity: isSubmitting || rows.length >= 20 ? 0.5 : 1,
          }}>
          <Plus size={14} /> Add Employee
        </button>
      </div>

      {/* Employee rows */}
      {rows.map((row, idx) => {
        const err = errors[idx]
        return (
          <div key={row.id} style={{ ...card, padding: 20 }}>
            {/* Row header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, color: Q.ink, fontSize: 14 }}>
                Employee {idx + 1}
              </span>
              {rows.length > 1 && (
                <button onClick={() => removeRow(row.id)} disabled={isSubmitting}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: Q.danger, padding: 4, display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>

              {/* Name */}
              <div>
                <label style={label}>Employee Name *</label>
                <input
                  style={input} placeholder="e.g. Alice" value={row.name}
                  onChange={e => updateRow(row.id, 'name', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Wallet */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={label}>Employee Wallet Address *</label>
                <input
                  style={{ ...input, borderColor: row.wallet && !isAddress(row.wallet) ? Q.danger : Q.border }}
                  placeholder="0x..." value={row.wallet}
                  onChange={e => updateRow(row.id, 'wallet', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Amount + Token */}
              <div>
                <label style={label}>Salary Amount *</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    style={{ ...input, flex: 1 }} type="number" placeholder="0.00" min="0" value={row.amount}
                    onChange={e => updateRow(row.id, 'amount', e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button onClick={() => toggleToken(row.id)} disabled={isSubmitting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: Q.surf, border: `1px solid ${Q.border}`,
                      borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                      color: Q.ink, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' as const,
                    }}>
                    <TokenIcon symbol={row.tokenSymbol} size={18} />
                    {row.tokenSymbol}
                    <ChevronDown size={12} style={{ color: Q.subtle }} />
                  </button>
                </div>
                {/* Token toggle cards */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {(['USDT', 'USDC'] as const).map(sym => (
                    <button key={sym} onClick={() => updateRow(row.id, 'tokenSymbol', sym)} disabled={isSubmitting}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                        background: row.tokenSymbol === sym ? Q.surf3 : Q.surf,
                        border: `1px solid ${row.tokenSymbol === sym ? Q.border2 : Q.border}`,
                        borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                      }}>
                      <TokenIcon symbol={sym} size={18} />
                      <div style={{ textAlign: 'left' as const }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: Q.ink }}>{sym}</p>
                        <p style={{ margin: 0, fontSize: 10, color: Q.subtle }}>{sym === 'USDT' ? 'Tether USD' : 'USD Coin'}</p>
                      </div>
                      {row.tokenSymbol === sym && (
                        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: Q.acc }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label style={label}>Start Date *</label>
                <input
                  style={input} type="date" value={row.startDate}
                  onChange={e => updateRow(row.id, 'startDate', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

            </div>

            {/* Row error */}
            {err && row.name + row.wallet + row.amount !== '' && (
              <p style={{ margin: '10px 0 0', color: Q.danger, fontSize: 12 }}>{err}</p>
            )}
          </div>
        )
      })}

      {/* Summary */}
      <div style={{ ...card, padding: 20 }}>
        <p style={{ margin: '0 0 12px', color: Q.muted, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          Summary
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: Q.muted, fontSize: 13 }}>Employees</span>
            <span style={{ color: Q.ink, fontSize: 13, fontWeight: 600 }}>{rows.length}</span>
          </div>
          {rows.map((r, i) => r.name && r.amount && (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12, borderLeft: `2px solid ${Q.border}` }}>
              <span style={{ color: Q.subtle, fontSize: 13 }}>{r.name || `Employee ${i + 1}`}</span>
              <span style={{ color: Q.ink, fontSize: 13, fontWeight: 600 }}>{r.amount} {r.tokenSymbol}</span>
            </div>
          ))}
          {rows.some(r => r.amount) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${Q.border}` }}>
              <span style={{ color: Q.muted, fontSize: 13, fontWeight: 600 }}>Total per period</span>
              <span style={{ color: Q.acc, fontSize: 14, fontWeight: 700 }}>
                {Object.entries(
                  rows.reduce((acc, r) => {
                    if (r.amount && !isNaN(Number(r.amount))) {
                      acc[r.tokenSymbol] = (acc[r.tokenSymbol] ?? 0) + Number(r.amount)
                    }
                    return acc
                  }, {} as Record<string, number>)
                ).map(([sym, total]) => `${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${sym}`).join(' + ')}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: Q.muted, fontSize: 13 }}>Blockchain transactions</span>
            <span style={{ color: Q.success, fontSize: 13, fontWeight: 600 }}>1 (batch)</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button onClick={() => { void handleSubmit() }} disabled={!canSubmit}
        style={{
          width: '100%', padding: '16px 24px', borderRadius: 14, border: 'none',
          background: canSubmit ? Q.acc : Q.surf3,
          color: canSubmit ? '#fff' : Q.muted,
          fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
          opacity: isSubmitting ? 0.75 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
        {isSubmitting && (
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 16 }}>⟳</span>
        )}
        {btnLabel}
      </button>
      <p style={{ textAlign: 'center', color: Q.subtle, fontSize: 12, margin: '-12px 0 0' }}>
        {rows.length === 1
          ? 'This will prompt a wallet signature to record the payroll on QMS Testnet'
          : `All ${rows.length} employees will be recorded in a single wallet signature on QMS Testnet`}
      </p>
    </div>
  )
}
