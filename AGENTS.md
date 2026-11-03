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
- Stablecoins: USDT `0x5D1386fC130143F92511bC2D18124D3E414ed429` (6 dec), USDC `0xDd4D61DF875cc613E1372c78827a5F4C2741bf11` (6 dec)
- DEX: QWAP Router `0x93AFF45f28e5DF1b55f5AEFEfB807De843b12619` (Uniswap V2-compatible)
- Toasts: Sonner

## Deployed Contracts (QMS Testnet)

| Contract | Address | Explorer |
|---|---|---|
| Create2Factory | `0x176725adc529512bD7Cad093a24969954ad34e51` | [View](https://testnet.qmsscan.io/address/0x176725adc529512bD7Cad093a24969954ad34e51) |
| QpayPayroll v1 | `0x257F3e776082D7a221A46B561F70f48032e8781D` | [View](https://testnet.qmsscan.io/address/0x257F3e776082D7a221A46B561F70f48032e8781D) |
| QpayPayroll v2 | `0xDda386351960a60a42FC89a64BbD0Bd9206d88B0` | [View](https://testnet.qmsscan.io/address/0xDda386351960a60a42FC89a64BbD0Bd9206d88B0) |
| QpayPayroll v3 | `0xFCB2D1735D05A396aAf817b82AE1145050f18885` | [View](https://testnet.qmsscan.io/address/0xFCB2D1735D05A396aAf817b82AE1145050f18885) |
| QpayPayroll v4 | `0xcCF4734715c19BA50e1C57e4c2964a81b2200CDf` | [View](https://testnet.qmsscan.io/address/0xcCF4734715c19BA50e1C57e4c2964a81b2200CDf) |
| QpayPayroll v5 (active) | `0x20aD2D6764d45c5A79DDBaB70aF11C2d86FbA6dB` | [View](https://testnet.qmsscan.io/address/0x20aD2D6764d45c5A79DDBaB70aF11C2d86FbA6dB) |
| QpaySwap v1    | `0xeDDf43468577A03B89496A8869277Dd62791cf43` | [View](https://testnet.qmsscan.io/address/0xeDDf43468577A03B89496A8869277Dd62791cf43) |

- Deployer: `0x4389006Dd061d13129a894b9E03a04EaE9B377b9`
- Create2Factory Tx: `0x909b70b93671f60595106c583519abc02276d9882560d96705d743d05ec45eab` (2026-10-10)
- QpayPayroll v1 Deployed: 2026-10-14 (no startDate enforcement)
- QpayPayroll v2 Deployed: 2026-10-14 (+ startDate enforcement via block.timestamp check)
- QpayPayroll v4 Deployed: 2026-11-03, Tx `0xa6cccaa073325626e59200265ba1357b601092e1a9b8880e1d5dbd1e7d8fd591`
- QpayPayroll v5 Deployed: 2026-11-03, Tx `0x9425ac75dfaca51fca7bfda11860dabe5c8ca40c466d7e34e02eb6894215720b` (+ recordPaymentTx stores pay tx hash in PayrollEntry.txRef; + employee != contract; + token addrs must be contracts; + paginated reads). Reviewed (full-depth) + Slither + 75 forge tests.
- v4/v5 constructor args (current): USDT=`0x5D1386fC130143F92511bC2D18124D3E414ed429`, USDC=`0xDd4D61DF875cc613E1372c78827a5F4C2741bf11` (both 6 dec, official QWAP tokens)
- v1-v3 constructor args (legacy tokens, obsolete): USDT=`0x72577544f4134a25E7f09d0B5FF0ca05A1249EbF`, USDC=`0xDfF68E53a0A8275212927c12017f5aB5f1842a04`

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
