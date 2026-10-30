/**
 * Swap page — uses QWAP router on QMS Testnet
 * Router: 0x93AFF45f28e5DF1b55f5AEFEfB807De843b12619 (Uniswap V2-compatible)
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  useAccount, useWaitForTransactionReceipt,
  useSwitchChain, useReadContract, useWriteContract,
} from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ConnectKitButton } from 'connectkit'
import {
  ArrowUpDown, Settings2, Info, ExternalLink, Loader2,
  AlertTriangle, TrendingUp, Zap, Shield, RotateCcw, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  QMS_CHAIN_ID, QWAP_ROUTER, WQMS_ADDRESS,
  SWAP_TOKENS, ROUTER_ABI, ERC20_APPROVE_ABI,
} from '../config'
import type { SwapToken } from '../config'
import { formatAmount, getExplorerTxUrl, parseOnchainError } from '../lib/utils'
import { Q } from '../theme'
import { useTokenBalances } from '../hooks/useTokenBalances'
import { useRecordSwap } from '../hooks/useSwapHistory'

import { TokenIcon as TokIcon } from '../components/TokenIcon'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return the on-chain address for a token (NATIVE → WQMS for path building) */
function tokenAddr(t: SwapToken): `0x${string}` {
  return t.address === 'NATIVE' ? WQMS_ADDRESS : t.address
}

/** Build routing path: direct or via WQMS as intermediate hop */
function buildPath(from: SwapToken, to: SwapToken): `0x${string}`[] {
  const a = tokenAddr(from)
  const b = tokenAddr(to)
  if (a === b) return [a]
  // If neither side is WQMS, route through WQMS
  if (a !== WQMS_ADDRESS && b !== WQMS_ADDRESS) {
    return [a, WQMS_ADDRESS, b]
  }
  return [a, b]
}

// ─── Token icon wrapper ───────────────────────────────────────────────────────
function TokenIcon({ token, size = 32 }: { token: SwapToken; size?: number }) {
  return <TokIcon symbol={token.symbol} size={size} />
}

// ─── Token dropdown ───────────────────────────────────────────────────────────
function TokenDropdown({
  selected, onSelect, exclude,
}: { selected: SwapToken; onSelect: (t: SwapToken) => void; exclude: string }) {
  const [open, setOpen] = useState(false)
  const list = SWAP_TOKENS.filter(t => t.symbol !== exclude)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px 8px 8px',
          background: '#1a2a3e', border: `1px solid ${Q.border}`,
          borderRadius: 12, cursor: 'pointer', flexShrink: 0,
        }}
      >
        <TokenIcon token={selected} size={26} />
        <span style={{ color: Q.ink, fontSize: 14, fontWeight: 700 }}>{selected.symbol}</span>
        <span style={{ color: Q.subtle, fontSize: 10, marginLeft: 1 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40,
          background: '#0f1928', border: `1px solid ${Q.border}`,
          borderRadius: 14, minWidth: 210, overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
        }}>
          <div style={{ padding: '10px 14px 7px', borderBottom: `1px solid ${Q.border}` }}>
            <span style={{ color: Q.subtle, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Select token
            </span>
          </div>
          {list.map(t => (
            <button key={t.symbol} onClick={() => { onSelect(t); setOpen(false) }} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer',
              background: t.symbol === selected.symbol ? '#0c1f33' : 'transparent',
            }}>
              <TokenIcon token={t} size={30} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ color: Q.ink, fontSize: 13, fontWeight: 600, margin: 0 }}>{t.symbol}</p>
                <p style={{ color: Q.subtle, fontSize: 11, margin: 0 }}>{t.name}</p>
              </div>
              {t.symbol === selected.symbol && <Check size={14} style={{ color: Q.acc, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Slippage settings panel (matches QWAP style) ────────────────────────────
interface SlippageSettings { auto: boolean; value: string; deadline: string }

function SlippagePanel({
  settings, onChange, onReset, onSave,
}: {
  settings: SlippageSettings
  onChange: (s: SlippageSettings) => void
  onReset: () => void
  onSave: () => void
}) {
  const slipNum = parseFloat(settings.value)
  const warn = !settings.auto && !isNaN(slipNum) && slipNum > 5

  return (
    <div style={{ margin: '14px 12px 0', background: '#0d1728', border: `1px solid ${Q.border}`, borderRadius: 14, padding: '16px' }}>
      {/* Max slippage row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ color: Q.ink2, fontSize: 13, fontWeight: 600 }}>Max slippage</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Auto toggle */}
          <button
            onClick={() => onChange({ ...settings, auto: !settings.auto })}
            style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: settings.auto ? Q.acc : '#1a2a3e',
              border: `1px solid ${settings.auto ? Q.acc : Q.border}`,
              color: settings.auto ? '#fff' : Q.muted,
              transition: 'all 0.15s',
            }}
          >
            Auto
          </button>
          {/* Numeric input */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#131f32', border: `1px solid ${settings.auto ? Q.border : Q.border2}`, borderRadius: 8, overflow: 'hidden' }}>
            <input
              type="number"
              value={settings.auto ? '2.5' : settings.value}
              readOnly={settings.auto}
              onChange={e => onChange({ ...settings, auto: false, value: e.target.value })}
              min="0.01" max="50" step="0.1"
              style={{
                width: 52, padding: '5px 8px', background: 'transparent', border: 'none',
                outline: 'none', color: settings.auto ? Q.muted : Q.ink,
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit', textAlign: 'right',
              }}
            />
            <span style={{ color: Q.subtle, fontSize: 12, paddingRight: 8, paddingLeft: 2 }}>%</span>
          </div>
        </div>
      </div>

      {warn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: Q.warn, fontSize: 12 }}>
          <AlertTriangle size={12} /> High slippage — your trade may be front-run
        </div>
      )}

      {/* Swap deadline row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: Q.ink2, fontSize: 13, fontWeight: 600 }}>Swap deadline</span>
        <div style={{ display: 'flex', alignItems: 'center', background: '#131f32', border: `1px solid ${Q.border2}`, borderRadius: 8, overflow: 'hidden' }}>
          <input
            type="number"
            value={settings.deadline}
            onChange={e => onChange({ ...settings, deadline: e.target.value })}
            min="1" max="60" step="1"
            style={{
              width: 52, padding: '5px 8px', background: 'transparent', border: 'none',
              outline: 'none', color: Q.ink, fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', textAlign: 'right',
            }}
          />
          <span style={{ color: Q.subtle, fontSize: 12, paddingRight: 8, paddingLeft: 2 }}>min</span>
        </div>
      </div>

      {/* Reset / Save */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onReset}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 10, border: `1px solid ${Q.border}`,
            background: '#131f32', color: Q.ink2, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
        <button
          onClick={onSave}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
            background: Q.acc, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 16px rgba(14,165,233,0.25)',
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ─── Default settings ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: SlippageSettings = { auto: true, value: '2.5', deadline: '5' }

// ─── Main Swap component ──────────────────────────────────────────────────────
export function Swap() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const wrong = isConnected && chainId !== QMS_CHAIN_ID

  // All token balances from a single hook
  const { balances: allBalances } = useTokenBalances(address)

  // Helper: get formatted balance string for any token symbol
  function getBal(symbol: string): string {
    return allBalances.find(b => b.symbol === symbol)?.formatted ?? '—'
  }
  function getBalRaw(symbol: string): bigint {
    return allBalances.find(b => b.symbol === symbol)?.raw ?? 0n
  }

  const [fromTok, setFromTok] = useState<SwapToken>(SWAP_TOKENS[0])  // QMS
  const [toTok,   setToTok]   = useState<SwapToken>(SWAP_TOKENS[2])  // USDT
  const [amtIn,   setAmtIn]   = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<SlippageSettings>(DEFAULT_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<SlippageSettings>(DEFAULT_SETTINGS)
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()
  const [swapHash,     setSwapHash]     = useState<`0x${string}` | undefined>()
  const [step, setStep] = useState<'idle' | 'approving' | 'swapping'>('idle')

  // Snapshot of the last swap details — populated just before setAmtIn('') clears them
  const lastSwapRef = useRef<{
    fromSymbol: string; toSymbol: string; amountIn: string; amountOut: string
    tokenIn: `0x${string}`; tokenOut: `0x${string}`
    amountInBig: bigint; amountOutBig: bigint
  } | null>(null)

  const { writeContractAsync } = useWriteContract()
  const { recordSwap } = useRecordSwap()
  const {
    isLoading: isApprovalConf,
    isSuccess: isApprovalSuccess,
    isError:   isApprovalError,
  } = useWaitForTransactionReceipt({ hash: approvalHash })
  const {
    isLoading: isSwapConf,
    isSuccess: isSwapSuccess,
    isError:   isSwapError,
  } = useWaitForTransactionReceipt({ hash: swapHash })
  const isBusy = step !== 'idle' || isApprovalConf || isSwapConf

  // Derived — true only once wagmi reports the receipt as successful
  const swapConfirmed = isSwapSuccess && !!swapHash

  // ── Compute route path ──────────────────────────────────────────────────────
  const path = useMemo(() => buildPath(fromTok, toTok), [fromTok, toTok])

  // ── Parse amtIn to BigInt ───────────────────────────────────────────────────
  const amtInBig = useMemo(() => {
    try {
      const n = parseFloat(amtIn)
      if (isNaN(n) || n <= 0) return 0n
      return parseUnits(amtIn, fromTok.decimals)
    } catch { return 0n }
  }, [amtIn, fromTok.decimals])

  // ── getAmountsOut — live quote from QWAP router ─────────────────────────────
  const { data: amountsOut, isLoading: isQuoting } = useReadContract({
    address: QWAP_ROUTER,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: path.length >= 2 ? [amtInBig, path] : [1n, [tokenAddr(fromTok), tokenAddr(toTok)]],
    chainId: QMS_CHAIN_ID,
    query: { enabled: amtInBig > 0n && path.length >= 2 },
  })

  const rawOut: bigint = amountsOut ? (amountsOut as bigint[])[amountsOut.length - 1] ?? 0n : 0n
  const amtOut = rawOut > 0n ? formatUnits(rawOut, toTok.decimals) : ''

  // ── Effective slippage ──────────────────────────────────────────────────────
  const effectiveSlip = savedSettings.auto ? 2.5 : (parseFloat(savedSettings.value) || 2.5)

  // amountOutMin = rawOut * (1 - slip/100), integer
  const amtOutMin = useMemo(() => {
    if (rawOut === 0n) return 0n
    const slipBps = BigInt(Math.round(effectiveSlip * 100))  // e.g. 250 for 2.5%
    return rawOut - (rawOut * slipBps / 10000n)
  }, [rawOut, effectiveSlip])

  // deadline: current timestamp + deadline minutes
  function deadlineTimestamp() {
    return BigInt(Math.floor(Date.now() / 1000) + parseInt(savedSettings.deadline || '20') * 60)
  }

  // ── Read current allowance (only for ERC-20 from tokens) ───────────────────
  const needsApproval = fromTok.address !== 'NATIVE'
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromTok.address !== 'NATIVE' ? fromTok.address : undefined,
    abi: ERC20_APPROVE_ABI,
    functionName: 'allowance',
    args: address ? [address, QWAP_ROUTER] : undefined,
    chainId: QMS_CHAIN_ID,
    query: { enabled: needsApproval && !!address && amtInBig > 0n },
  })

  const hasAllowance = !needsApproval || (allowance !== undefined && (allowance) >= amtInBig)

  // ── Insufficient check — uses allBalances from useTokenBalances ────────────
  const fromBalRaw = getBalRaw(fromTok.symbol)
  const insufficient = amtInBig > 0n && fromBalRaw > 0n && amtInBig > fromBalRaw

  const canSwap = isConnected && !wrong && !isBusy && !insufficient && amtInBig > 0n && amtOut !== ''

  // ── Toast + record on swap receipt ──────────────────────────────────────────
  useEffect(() => {
    if (isSwapSuccess && swapHash && address) {
      const snap = lastSwapRef.current
      lastSwapRef.current = null
      toast.success('Swap confirmed!')
      // Record swap to on-chain history contract (fire-and-forget, no blocking)
      if (snap) {
        void recordSwap({
          wallet:     address,
          swapTxHash: swapHash,
          tokenIn:    snap.tokenIn,
          tokenOut:   snap.tokenOut,
          amountIn:   snap.amountInBig,
          amountOut:  snap.amountOutBig,
        }).catch(() => {
          // recordSwap failure is non-critical — swap already succeeded
        })
      }
    }
    if (isSwapError) {
      toast.error('Transaction failed or reverted on-chain.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSwapSuccess, isSwapError])

  // ── Re-fetch allowance after approval confirm, then reset step ──────────────
  useEffect(() => {
    if (isApprovalSuccess) {
      void refetchAllowance()
      setStep('idle')
      toast.success('Approved! You can now swap.')
    }
    if (isApprovalError) {
      setStep('idle')
      toast.error('Approval transaction failed.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApprovalSuccess, isApprovalError])

  // ── Approve ─────────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!address || fromTok.address === 'NATIVE') return
    setStep('approving')
    try {
      const hash = await writeContractAsync({
        address: fromTok.address,
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [QWAP_ROUTER, amtInBig * 2n],  // approve 2x to avoid repeated approvals
        chainId: QMS_CHAIN_ID,
      })
      setApprovalHash(hash)
      toast.success('Approval submitted — waiting for confirmation…')
    } catch (err) {
      toast.error(parseOnchainError(err))
      setStep('idle')
    }
  }, [address, fromTok, amtInBig, writeContractAsync])

  // ── Swap ────────────────────────────────────────────────────────────────────
  const handleSwap = useCallback(async () => {
    if (!address || amtInBig === 0n || amtOutMin === 0n) return
    if (wrong) { switchChain({ chainId: QMS_CHAIN_ID }); return }

    setStep('swapping')
    setSwapHash(undefined)
    try {
      const dl = deadlineTimestamp()
      let hash: `0x${string}`

      if (fromTok.address === 'NATIVE') {
        // QMS → token: swapExactETHForTokens
        hash = await writeContractAsync({
          address: QWAP_ROUTER,
          abi: ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [amtOutMin, path, address, dl],
          value: amtInBig,
          chainId: QMS_CHAIN_ID,
        })
      } else if (toTok.address === 'NATIVE') {
        // token → QMS: swapExactTokensForETH
        hash = await writeContractAsync({
          address: QWAP_ROUTER,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForETH',
          args: [amtInBig, amtOutMin, path, address, dl],
          chainId: QMS_CHAIN_ID,
        })
      } else {
        // token → token
        hash = await writeContractAsync({
          address: QWAP_ROUTER,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [amtInBig, amtOutMin, path, address, dl],
          chainId: QMS_CHAIN_ID,
        })
      }

      // Snapshot before clearing inputs (includes on-chain data for recordSwap)
      lastSwapRef.current = {
        fromSymbol:  fromTok.symbol,
        toSymbol:    toTok.symbol,
        amountIn:    amtIn,
        amountOut:   amtOut,
        tokenIn:     tokenAddr(fromTok),
        tokenOut:    tokenAddr(toTok),
        amountInBig: amtInBig,
        amountOutBig: amtOutMin,
      }
      setSwapHash(hash)
      setAmtIn('')
      // Show a neutral "pending" toast while we wait for on-chain confirmation
      toast.info('Transaction submitted — waiting for confirmation…')
    } catch (err) {
      toast.error(parseOnchainError(err))
      setSwapHash(undefined)
    } finally {
      setStep('idle')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, amtInBig, amtOutMin, amtOut, amtIn, path, fromTok, toTok, wrong, switchChain, writeContractAsync])

  // ── Flip tokens ─────────────────────────────────────────────────────────────
  function flipTokens() {
    setFromTok(toTok)
    setToTok(fromTok)
    setAmtIn(amtOut)
  }

  // ── Button label ─────────────────────────────────────────────────────────────
  function btnLabel() {
    if (step === 'approving' || isApprovalConf) return <><Loader2 size={16} className="animate-spin" /> Approving…</>
    if (step === 'swapping'  || isSwapConf)    return <><Loader2 size={16} className="animate-spin" /> Swapping…</>
    if (insufficient)   return 'Insufficient Balance'
    if (wrong)          return 'Switch to QMS Testnet'
    if (!amtIn || amtInBig === 0n) return 'Enter an amount'
    if (isQuoting)      return <><Loader2 size={16} className="animate-spin" /> Getting quote…</>
    if (!amtOut)        return 'No liquidity for this pair'
    if (!hasAllowance)  return `Approve ${fromTok.symbol}`
    return 'Swap'
  }

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px' }}>
        <div style={{ background: '#131f32', border: `1px solid ${Q.border}`, borderRadius: 24, padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0c1f33', border: `2px solid ${Q.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ArrowUpDown size={28} style={{ color: Q.acc }} />
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", color: Q.ink, fontSize: 26, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Swap Tokens</h2>
          <p style={{ color: Q.muted, margin: '0 0 28px', fontSize: 14, lineHeight: 1.6 }}>Connect your wallet to swap tokens instantly via QWAP on QMS Testnet.</p>
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button onClick={show} style={{ width: '100%', padding: '14px 0', background: Q.acc, color: '#fff', borderRadius: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15, boxShadow: '0 0 24px rgba(14,165,233,0.3)' }}>
                Connect Wallet
              </button>
            )}
          </ConnectKitButton.Custom>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 28 }}>
            {([
              { Icon: Zap,        label: 'Instant',   sub: 'Sub-second'     },
              { Icon: Shield,     label: 'Secure',    sub: 'Non-custodial'  },
              { Icon: TrendingUp, label: 'Best Rate', sub: 'QWAP Router'    },
            ] as const).map(({ Icon, label, sub }) => (
              <div key={label} style={{ background: '#0f1928', border: `1px solid ${Q.border}`, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <Icon size={18} style={{ color: Q.acc, margin: '0 auto 6px' }} />
                <p style={{ color: Q.ink2, fontSize: 12, fontWeight: 600, margin: 0 }}>{label}</p>
                <p style={{ color: Q.subtle, fontSize: 10, margin: '2px 0 0' }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Connected ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px 48px' }}>

      {/* Wrong chain */}
      {wrong && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: Q.warn, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} /> Wrong network
          </span>
          <button onClick={() => switchChain({ chainId: QMS_CHAIN_ID })} style={{ padding: '6px 14px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: Q.warn, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Switch
          </button>
        </div>
      )}

      {/* Swap card */}
      <div style={{ background: '#131f32', border: `1px solid ${Q.border}`, borderRadius: 24, position: 'relative' }}>

        {/* Card header */}
        <div style={{ padding: '18px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#0c1f33', border: `1px solid ${Q.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpDown size={14} style={{ color: Q.acc }} />
            </div>
            <span style={{ color: Q.ink, fontSize: 14, fontWeight: 700 }}>Swap</span>
          </div>
          <button
            onClick={() => setShowSettings(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 9, cursor: 'pointer',
              background: showSettings ? '#0c1f33' : '#0f1928',
              border: `1px solid ${showSettings ? Q.border2 : Q.border}`,
              color: showSettings ? Q.acc : Q.subtle, fontSize: 12, fontWeight: 600,
            }}
          >
            <Settings2 size={13} />
            {savedSettings.auto ? 'Auto' : `${savedSettings.value}%`} slippage
          </button>
        </div>

        {/* Slippage settings panel */}
        {showSettings && (
          <SlippagePanel
            settings={settings}
            onChange={setSettings}
            onReset={() => setSettings(DEFAULT_SETTINGS)}
            onSave={() => { setSavedSettings(settings); setShowSettings(false); toast.success('Settings saved') }}
          />
        )}

        {/* FROM box */}
        <div style={{ margin: '14px 12px 0', background: '#0f1928', border: `1px solid ${Q.border}`, borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ color: Q.subtle, fontSize: 12, fontWeight: 500 }}>Sell</span>
            <button
              onClick={() => {
                const raw = getBalRaw(fromTok.symbol)
                const full = parseFloat(formatUnits(raw, fromTok.decimals))
                if (full > 0) setAmtIn(formatAmount(full, fromTok.decimals > 6 ? 6 : fromTok.decimals))
              }}
              style={{ color: Q.acc, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Balance: <span style={{ color: Q.ink2 }}>{getBal(fromTok.symbol)}</span>
            </button>
          </div>
          {/* % quick-select */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['25%', '50%', '75%', 'MAX'].map(pct => (
              <button key={pct} onClick={() => {
                const raw = getBalRaw(fromTok.symbol)
                const full = parseFloat(formatUnits(raw, fromTok.decimals))
                const mult = pct === 'MAX' ? 1 : parseInt(pct) / 100
                setAmtIn(formatAmount(full * mult, fromTok.decimals > 6 ? 6 : fromTok.decimals))
              }} style={{
                padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: '#1a2a3e', border: `1px solid ${Q.border}`, color: Q.muted,
              }}>
                {pct}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number" value={amtIn} onChange={e => setAmtIn(e.target.value)}
              placeholder="0.00" min="0" step="any"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: insufficient ? Q.danger : Q.ink,
                fontSize: 30, fontWeight: 700, fontFamily: "'Space Grotesk', monospace",
                letterSpacing: '-0.02em', minWidth: 0,
              }}
            />
            <TokenDropdown selected={fromTok} onSelect={tok => { setFromTok(tok); setAmtIn('') }} exclude={toTok.symbol} />
          </div>
        </div>

        {/* FLIP */}
        <div style={{ display: 'flex', justifyContent: 'center', height: 0, position: 'relative', zIndex: 10, margin: '0 12px' }}>
          <button
            onClick={flipTokens}
            style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              width: 38, height: 38, borderRadius: '50%',
              background: '#131f32', border: `2px solid ${Q.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: Q.acc,
              boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
            }}
          >
            <ArrowUpDown size={15} />
          </button>
        </div>

        {/* TO box */}
        <div style={{ margin: '10px 12px 0', background: '#0f1928', border: `1px solid ${Q.border}`, borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ color: Q.subtle, fontSize: 12, fontWeight: 500 }}>Receive</span>
            <span style={{ color: Q.subtle, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              Balance: <span style={{ color: Q.ink2, fontWeight: 600 }}>{getBal(toTok.symbol)}</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              flex: 1, minWidth: 0,
              color: isQuoting ? Q.subtle : (amtOut ? Q.success : Q.subtle),
              fontSize: 30, fontWeight: 700, fontFamily: "'Space Grotesk', monospace",
              letterSpacing: '-0.02em',
            }}>
              {isQuoting ? '…' : (amtOut ? formatAmount(parseFloat(amtOut), 6) : '0.00')}
            </span>
            <TokenDropdown selected={toTok} onSelect={tok => { setToTok(tok); setAmtIn('') }} exclude={fromTok.symbol} />
          </div>
        </div>

        {/* Quote detail rows */}
        {amtOut && amtInBig > 0n && (
          <div style={{ margin: '12px 12px 0', background: '#0d1728', border: `1px solid ${Q.border}`, borderRadius: 12, padding: '10px 14px' }}>
            {[
              {
                label: 'Rate',
                value: `1 ${fromTok.symbol} ≈ ${formatAmount(parseFloat(amtOut) / parseFloat(amtIn), 6)} ${toTok.symbol}`,
              },
              {
                label: 'Min. received',
                value: `${formatAmount(parseFloat(formatUnits(amtOutMin, toTok.decimals)), 6)} ${toTok.symbol}`,
              },
              {
                label: 'Max slippage',
                value: savedSettings.auto ? `Auto (${effectiveSlip}%)` : `${effectiveSlip}%`,
                color: effectiveSlip > 5 ? Q.warn : Q.ink2,
              },
              {
                label: 'Route',
                value: path.map(a => SWAP_TOKENS.find(t => tokenAddr(t) === a)?.symbol ?? a.slice(0, 6)).join(' → '),
              },
              { label: 'Deadline', value: `${savedSettings.deadline} min` },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: label !== 'Deadline' ? `1px solid ${Q.border}` : 'none' }}>
                <span style={{ color: Q.subtle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Info size={10} /> {label}
                </span>
                <span style={{ color: color ?? Q.ink2, fontSize: 12, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action button */}
        <div style={{ padding: '14px 12px 16px' }}>
          <button
            onClick={() => { void (hasAllowance ? handleSwap() : handleApprove()) }}
            disabled={!isConnected || isBusy || (!amtOut && amtInBig > 0n && !isQuoting) || insufficient || wrong}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
              background: insufficient ? Q.danger : canSwap || (!hasAllowance && amtInBig > 0n) ? Q.acc : '#1a2a3e',
              color: (canSwap || (!hasAllowance && amtInBig > 0n)) && !insufficient ? '#fff' : Q.subtle,
              fontSize: 15, fontWeight: 700, cursor: (canSwap || (!hasAllowance && amtInBig > 0n)) ? 'pointer' : 'not-allowed',
              boxShadow: canSwap ? '0 0 28px rgba(14,165,233,0.28)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
              opacity: (!canSwap && hasAllowance && !insufficient) ? 0.65 : 1,
            }}
          >
            {btnLabel()}
          </button>
        </div>
      </div>

      {/* Pending banner — shown while tx is in mempool awaiting confirmation */}
      {swapHash && isSwapConf && !swapConfirmed && (
        <div style={{ marginTop: 14, padding: '14px 18px', background: '#0d1728', border: `1px solid ${Q.border2}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Loader2 size={18} style={{ color: Q.acc, flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            <div>
              <p style={{ color: Q.ink2, fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>Waiting for confirmation…</p>
              <p style={{ color: Q.subtle, fontSize: 12, margin: 0 }}>Your transaction is being processed on-chain</p>
            </div>
          </div>
          <a href={getExplorerTxUrl(swapHash)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: Q.subtle, fontSize: 12, fontWeight: 600, textDecoration: 'none', padding: '7px 12px', background: '#0c1f33', border: `1px solid ${Q.border}`, borderRadius: 10, flexShrink: 0 }}>
            Tx <ExternalLink size={11} />
          </a>
        </div>
      )}

      {/* Success banner — shown only after on-chain confirmation */}
      {swapConfirmed && swapHash && (
        <div style={{ marginTop: 14, padding: '14px 18px', background: '#0a2118', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1.5px solid rgba(52,211,153,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={16} style={{ color: Q.success }} />
            </div>
            <div>
              <p style={{ color: Q.success, fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>Swap Confirmed!</p>
              <p style={{ color: Q.subtle, fontSize: 12, margin: 0 }}>Transaction finalised on QMS Testnet</p>
            </div>
          </div>
          <a href={getExplorerTxUrl(swapHash)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: Q.acc, fontSize: 13, fontWeight: 600, textDecoration: 'none', padding: '8px 14px', background: '#0c1f33', border: `1px solid ${Q.border2}`, borderRadius: 10, flexShrink: 0 }}>
            Explorer <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  )
}
