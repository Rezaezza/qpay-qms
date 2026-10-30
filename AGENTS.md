# Qpay — Payroll & Swap dApp

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app.

---

## What This App Does

Qpay is a dApp on QMS Testnet for employee payroll (USDT/USDC) and token swaps via the QWAP DEX router.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/script/`.
- Wallet: injected (MetaMask, etc.)
- Chain: QMS Testnet (Chain ID: 19480, RPC: https://rpc.testnet.qms.finance)
- Stablecoins: USDT `0x72577544f4134a25E7f09d0B5FF0ca05A1249EbF` (6 dec), USDC `0xDfF68E53a0A8275212927c12017f5aB5f1842a04` (6 dec)
- DEX: QWAP Router `0x93AFF45f28e5DF1b55f5AEFEfB807De843b12619` (Uniswap V2-compatible)
- Toasts: Sonner

## Deployed Contracts (QMS Testnet)

| Contract | Address | Explorer |
|---|---|---|
| Create2Factory | `0x176725adc529512bD7Cad093a24969954ad34e51` | [View](https://testnet.qmsscan.io/address/0x176725adc529512bD7Cad093a24969954ad34e51) |
| QpayPayroll v1 | `0x257F3e776082D7a221A46B561F70f48032e8781D` | [View](https://testnet.qmsscan.io/address/0x257F3e776082D7a221A46B561F70f48032e8781D) |
| QpayPayroll v2 | `0xDda386351960a60a42FC89a64BbD0Bd9206d88B0` | [View](https://testnet.qmsscan.io/address/0xDda386351960a60a42FC89a64BbD0Bd9206d88B0) |
| QpayPayroll v3 | `0xFCB2D1735D05A396aAf817b82AE1145050f18885` | [View](https://testnet.qmsscan.io/address/0xFCB2D1735D05A396aAf817b82AE1145050f18885) |
| QpaySwap v1    | `0xeDDf43468577A03B89496A8869277Dd62791cf43` | [View](https://testnet.qmsscan.io/address/0xeDDf43468577A03B89496A8869277Dd62791cf43) |

- Deployer: `0x4389006Dd061d13129a894b9E03a04EaE9B377b9`
- Create2Factory Tx: `0x909b70b93671f60595106c583519abc02276d9882560d96705d743d05ec45eab` (2026-10-10)
- QpayPayroll v1 Deployed: 2026-10-14 (no startDate enforcement)
- QpayPayroll v2 Deployed: 2026-10-14 (+ startDate enforcement via block.timestamp check)
- Constructor args: USDT=`0x72577544f4134a25E7f09d0B5FF0ca05A1249EbF`, USDC=`0xDfF68E53a0A8275212927c12017f5aB5f1842a04`

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
