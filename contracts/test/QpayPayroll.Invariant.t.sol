// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {QpayPayrollTestBase} from "./QpayPayroll.Base.t.sol";
import {QpayPayroll} from "../QpayPayroll.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

contract PayrollHandler {
    QpayPayroll public immutable payroll;
    address public immutable employer;
    uint256 public created;
    uint256 public paidTotalUsdt;
    uint256 public paidTotalUsdc;

    constructor(QpayPayroll p, address e) {
        payroll = p;
        employer = e;
    }

    function create(uint256 amount, bool usdc, uint8 who) external {
        amount = amount % 1000e6 + 1;
        address emp = address(uint160(0x5000 + (who % 8)));
        payroll.createPayroll("h", emp, amount, usdc ? QpayPayroll.PayToken.USDC : QpayPayroll.PayToken.USDT, QpayPayroll.PayFrequency.OneTime, 0);
        created++;
    }

    function pay(uint256 idSeed) external {
        if (created == 0) return;
        uint256 id = idSeed % created + 1;
        QpayPayroll.PayrollEntry memory e = payroll.getPayroll(id);
        if (e.status != QpayPayroll.PayStatus.Pending) return;
        payroll.payEmployee(id);
        if (e.token == QpayPayroll.PayToken.USDT) paidTotalUsdt += e.amount;
        else paidTotalUsdc += e.amount;
    }

    function cancel(uint256 idSeed) external {
        if (created == 0) return;
        uint256 id = idSeed % created + 1;
        QpayPayroll.PayrollEntry memory e = payroll.getPayroll(id);
        if (e.status != QpayPayroll.PayStatus.Pending) return;
        payroll.cancelPayroll(id);
    }
}

contract QpayPayrollInvariantTest is QpayPayrollTestBase {
    PayrollHandler internal handler;

    function setUp() public override {
        super.setUp();
        handler = new PayrollHandler(payroll, employer);
        vm.startPrank(employer);
        usdt.transfer(address(handler), FUNDS);
        usdc.transfer(address(handler), FUNDS);
        vm.stopPrank();
        // handler is the employer of its payrolls; it must approve the payroll contract
        vm.startPrank(address(handler));
        usdt.approve(address(payroll), type(uint256).max);
        usdc.approve(address(payroll), type(uint256).max);
        vm.stopPrank();

        targetContract(address(handler));
        bytes4[] memory sels = new bytes4[](3);
        sels[0] = PayrollHandler.create.selector;
        sels[1] = PayrollHandler.pay.selector;
        sels[2] = PayrollHandler.cancel.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: sels}));
    }

    /// Payroll contract never custodies funds.
    function invariant_PayrollHoldsNoTokens() public view {
        assertEq(usdt.balanceOf(address(payroll)), 0);
        assertEq(usdc.balanceOf(address(payroll)), 0);
    }

    /// Funds leaving the employer equal the sum of Paid amounts, per token.
    function invariant_ConservationOfFunds() public view {
        assertEq(usdt.balanceOf(address(handler)), FUNDS - handler.paidTotalUsdt());
        assertEq(usdc.balanceOf(address(handler)), FUNDS - handler.paidTotalUsdc());
        assertEq(usdt.totalSupply(), FUNDS);
    }

    /// Ids are dense: employer count equals number created.
    function invariant_EmployerCountMatchesCreated() public view {
        assertEq(payroll.getEmployerPayrollCount(address(handler)), handler.created());
    }
}
