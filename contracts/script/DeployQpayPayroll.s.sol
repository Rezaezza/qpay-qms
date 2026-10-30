// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../QpayPayroll.sol";

contract DeployQpayPayroll is Script {
    // QMS Testnet stablecoin addresses
    address constant USDT = 0x72577544f4134a25E7f09d0B5FF0ca05A1249EbF;
    address constant USDC = 0xDfF68E53a0A8275212927c12017f5aB5f1842a04;

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
