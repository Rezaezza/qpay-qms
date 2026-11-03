// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {QpayPayroll} from "../QpayPayroll.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

abstract contract QpayPayrollTestBase is Test {
    QpayPayroll internal payroll;
    MockERC20 internal usdt;
    MockERC20 internal usdc;

    address internal employer = makeAddr("employer");
    address internal other = makeAddr("other");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    QpayPayroll.PayToken internal constant T_USDT = QpayPayroll.PayToken.USDT;
    QpayPayroll.PayToken internal constant T_USDC = QpayPayroll.PayToken.USDC;
    QpayPayroll.PayFrequency internal constant F_ONE = QpayPayroll.PayFrequency.OneTime;

    uint256 internal constant FUNDS = 1_000_000e6;

    function setUp() public virtual {
        usdt = new MockERC20("Mock USDT", "mUSDT", 6);
        usdc = new MockERC20("Mock USDC", "mUSDC", 6);
        payroll = new QpayPayroll(address(usdt), address(usdc));

        usdt.mint(employer, FUNDS);
        usdc.mint(employer, FUNDS);
        vm.startPrank(employer);
        usdt.approve(address(payroll), type(uint256).max);
        usdc.approve(address(payroll), type(uint256).max);
        vm.stopPrank();
    }

    function _create(address emp, uint256 amount, QpayPayroll.PayToken t, uint256 start) internal returns (uint256 id) {
        vm.prank(employer);
        id = payroll.createPayroll("Name", emp, amount, t, F_ONE, start);
    }

    function _createDefault() internal returns (uint256) {
        return _create(alice, 100e6, T_USDT, 0);
    }

    function _pay(uint256 id) internal {
        vm.prank(employer);
        payroll.payEmployee(id);
    }

    function _batchArrays(uint256 n)
        internal
        view
        returns (
            string[] memory names,
            address[] memory emps,
            uint256[] memory amts,
            QpayPayroll.PayToken[] memory toks,
            QpayPayroll.PayFrequency[] memory freqs,
            uint256[] memory starts
        )
    {
        names = new string[](n);
        emps = new address[](n);
        amts = new uint256[](n);
        toks = new QpayPayroll.PayToken[](n);
        freqs = new QpayPayroll.PayFrequency[](n);
        starts = new uint256[](n);
        for (uint256 i = 0; i < n; ++i) {
            names[i] = "N";
            emps[i] = address(uint160(0x1000 + i));
            amts[i] = 1e6;
            toks[i] = (i % 2 == 0) ? T_USDT : T_USDC;
            freqs[i] = F_ONE;
            starts[i] = 0;
        }
    }

    function _ids(uint256 n) internal pure returns (uint256[] memory ids) {
        ids = new uint256[](n);
        for (uint256 i = 0; i < n; ++i) ids[i] = i + 1;
    }
}
