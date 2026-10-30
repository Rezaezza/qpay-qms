import { useAccount, useSwitchChain } from 'wagmi'
import { QMS_CHAIN_ID, qmsTestnet } from '../config'
import { Wifi, CheckCircle } from 'lucide-react'

export function NetworkBanner() {
  const { chainId, isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected) return null
  if (chainId === QMS_CHAIN_ID) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-[var(--success)]/20 text-[var(--success)] text-xs font-medium">
        <CheckCircle size={12} />
        <span>QMS Testnet</span>
      </div>
    )
  }

  return (
    <button
      onClick={() => switchChain({ chainId: QMS_CHAIN_ID })}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] transition-all duration-150 accent-glow disabled:opacity-60"
    >
      <Wifi size={16} />
      <span>{isPending ? 'Switching…' : `Switch to ${qmsTestnet.name}`}</span>
    </button>
  )
}
