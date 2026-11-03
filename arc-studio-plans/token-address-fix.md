## Implementation Plan: Qpay Token Address Correction (USDC and USDT)

### Summary
Qpay uses USDC and USDT addresses that differ from the tokens used by QWAP, which likely explains the swap rate mismatch (3.57 in Qpay vs 0.49 in QWAP): different tokens sit in different liquidity pools. This plan switches to the correct addresses (USDC `0xDd4D61DF875cc613E1372c78827a5F4C2741bf11`, USDT `0x5D1386fC130143F92511bC2D18124D3E414ed429`), redeploys the payroll contract, and matches the swap rate to QWAP.

### Architecture
- Blockchain: QMS Testnet (Chain ID 19480).
- Contract: `QpayPayroll` stores USDT and USDC as `immutable` constructor args, so v3 cannot be changed. A v4 deploy with the new addresses is required. `QpaySwap` stores no token addresses and needs no redeploy.
- Frontend: `src/config.ts` is the single source of token addresses. Balances, swap, payroll, and history all read from it.
- Wallet: ConnectKit, unchanged.
- Data impact:
  - Existing v3 payrolls use the old tokens and do not carry over to v4. The payroll list starts empty on v4.
  - Old swap history in `QpaySwap` stores the old token addresses. Keep the old addresses in the symbol-mapping table so history still shows USDT or USDC instead of a truncated address.

### Files to Create/Modify
1. `src/config.ts`: replace USDT and USDC addresses in `STABLECOINS` and `SWAP_TOKENS`, add a list of legacy addresses for history mapping, and point `QPAY_PAYROLL_ADDRESS` to v4.
2. `contracts/script/DeployQpayPayroll.s.sol`: switch constructor args to the new addresses.
3. `src/hooks/useSwapHistory.ts`: `addrToSymbol` and `addrToDecimals` recognise both new and legacy addresses.
4. `src/pages/Overview.tsx`: update the stablecoin addresses and the QpayPayroll contract card (v4, new address, deploy date).
5. `public/docs.html`: update token addresses, the QpayPayroll card, and add a v1.3 changelog entry.
6. `AGENTS.md`: record the v4 deploy and the new token addresses.
7. `src/pages/Swap.tsx`: only if the rate still differs from QWAP after the address change; routing adjustments go here.

### Build Sequence
1. Verify on the RPC that both new addresses are ERC-20 contracts. Read `decimals()` and `symbol()`. Do not assume 6 decimals; set config from the actual values.
2. Update `src/config.ts` with the new token addresses and the legacy list.
3. Update `useSwapHistory.ts` so symbol and decimals mapping supports new and legacy addresses.
4. Check on the RPC: `getAmountsOut` for 1 QMS to USDC with the new addresses, compared against QWAP (about 0.49 USDC). Also check the direct `[WQMS, token]` path. If it still differs, adjust `buildPath` in `Swap.tsx`.
5. Compile `QpayPayroll` with the new constructor args and redeploy as v4 on QMS Testnet. Deploy needs `PRIVATE_KEY` in `.env`; the user adds it at this step and it is erased right after deploy.
6. Update `QPAY_PAYROLL_ADDRESS` to v4, then update Overview, docs, and `AGENTS.md`.
7. Run lint and typecheck.

### Done When
- [ ] USDC and USDT in Qpay match the tokens used on testnet.qwap.xyz.
- [ ] The 1 QMS to USDC swap rate in Qpay matches QWAP (about 0.49).
- [ ] USDC and USDT balances on Home and Swap reflect the new tokens.
- [ ] Create Payroll, Pay, and Pay All work on QpayPayroll v4 with the new tokens.
- [ ] Old swap history still displays with correct symbols.
- [ ] Overview, docs, and AGENTS.md show the new addresses and contract.
- [ ] `PRIVATE_KEY` is removed from `.env` after deploy.
- [ ] Lint and typecheck are clean.
