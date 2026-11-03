// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../QpayPayroll.sol";

contract DeployQpayPayroll is Script {
    // QMS Testnet stablecoin addresses
    address constant USDT = 0x5D1386fC130143F92511bC2D18124D3E414ed429;
    address constant USDC = 0xDd4D61DF875cc613E1372c78827a5F4C2741bf11;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        QpayPayroll payroll = new QpayPayroll(USDT, USDC);

        vm.stopBroadcast();

        console.log("QpayPayroll deployed at:", address(payroll));
        console.log("USDT_TOKEN:", payroll.USDT_TOKEN());
        console.log("USDC_TOKEN:", payroll.USDC_TOKEN());
    }
}
