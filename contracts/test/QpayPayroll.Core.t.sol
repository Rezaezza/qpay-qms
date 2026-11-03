// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {QpayPayrollTestBase} from "./QpayPayroll.Base.t.sol";
import {QpayPayroll} from "../QpayPayroll.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

contract QpayPayrollCoreTest is QpayPayrollTestBase {
    // ---------- constructor ----------
    function test_Constructor_StoresTokens() public view {
        assertEq(payroll.USDT_TOKEN(), address(usdt));
        assertEq(payroll.USDC_TOKEN(), address(usdc));
    }

    function test_Constructor_RevertsZeroUsdt() public {
        vm.expectRevert(QpayPayroll.ZeroTokenAddress.selector);
        new QpayPayroll(address(0), address(usdc));
    }

    function test_Constructor_RevertsZeroUsdc() public {
        vm.expectRevert(QpayPayroll.ZeroTokenAddress.selector);
        new QpayPayroll(address(usdt), address(0));
    }

    function test_Constructor_RevertsEOAUsdt() public {
        vm.expectRevert(QpayPayroll.TokenNotContract.selector);
        new QpayPayroll(alice, address(usdc));
    }

    function test_Constructor_RevertsEOAUsdc() public {
        vm.expectRevert(QpayPayroll.TokenNotContract.selector);
        new QpayPayroll(address(usdt), alice);
    }

    // ---------- createPayroll ----------
    function test_CreatePayroll_StoresEntry() public {
        vm.warp(1000);
        vm.prank(employer);
        uint256 id = payroll.createPayroll("Alice", alice, 250e6, T_USDC, QpayPayroll.PayFrequency.Monthly, 5000);
        assertEq(id, 1);
        QpayPayroll.PayrollEntry memory e = payroll.getPayroll(id);
        assertEq(e.id, 1);
        assertEq(e.employer, employer);
        assertEq(e.employeeName, "Alice");
        assertEq(e.employee, alice);
        assertEq(e.amount, 250e6);
        assertEq(uint8(e.token), uint8(T_USDC));
        assertEq(uint8(e.frequency), uint8(QpayPayroll.PayFrequency.Monthly));
        assertEq(e.startDate, 5000);
        assertEq(uint8(e.status), uint8(QpayPayroll.PayStatus.Pending));
        assertEq(e.createdAt, 1000);
        assertEq(e.paidAt, 0);
        assertEq(e.txRef, bytes32(0));
    }

    function test_CreatePayroll_IncrementsIdsAndTracksEmployer() public {
        uint256 a = _createDefault();
        uint256 b = _createDefault();
        assertEq(a, 1);
        assertEq(b, 2);
        uint256[] memory ids = payroll.getEmployerPayrolls(employer);
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
    }

    function test_CreatePayroll_EmitsEvent() public {
        vm.expectEmit(true, true, true, true, address(payroll));
        emit QpayPayroll.PayrollCreated(1, employer, alice, 100e6, T_USDT, F_ONE, 77);
        vm.prank(employer);
        payroll.createPayroll("Alice", alice, 100e6, T_USDT, F_ONE, 77);
    }

    function test_CreatePayroll_RevertsZeroEmployee() public {
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.InvalidEmployee.selector);
        payroll.createPayroll("x", address(0), 1, T_USDT, F_ONE, 0);
    }

    function test_CreatePayroll_RevertsEmployeeIsContract() public {
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.InvalidEmployee.selector);
        payroll.createPayroll("x", address(payroll), 1, T_USDT, F_ONE, 0);
    }

    function test_CreatePayroll_RevertsZeroAmount() public {
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.InvalidAmount.selector);
        payroll.createPayroll("x", alice, 0, T_USDT, F_ONE, 0);
    }

    // ---------- batchCreatePayroll ----------
    function test_BatchCreate_HappyPath() public {
        (string[] memory n, address[] memory e, uint256[] memory a, QpayPayroll.PayToken[] memory t, QpayPayroll.PayFrequency[] memory f, uint256[] memory s) = _batchArrays(3);
        vm.prank(employer);
        uint256[] memory ids = payroll.batchCreatePayroll(n, e, a, t, f, s);
        assertEq(ids.length, 3);
        for (uint256 i = 0; i < 3; ++i) {
            assertEq(ids[i], i + 1);
            QpayPayroll.PayrollEntry memory p = payroll.getPayroll(ids[i]);
            assertEq(p.employee, e[i]);
            assertEq(p.employer, employer);
            assertEq(uint8(p.token), uint8(t[i]));
        }
        assertEq(payroll.getEmployerPayrollCount(employer), 3);
    }

    function test_BatchCreate_MaxSize50() public {
        (string[] memory n, address[] memory e, uint256[] memory a, QpayPayroll.PayToken[] memory t, QpayPayroll.PayFrequency[] memory f, uint256[] memory s) = _batchArrays(50);
        vm.prank(employer);
        uint256[] memory ids = payroll.batchCreatePayroll(n, e, a, t, f, s);
        assertEq(ids.length, 50);
    }

    function test_BatchCreate_RevertsEmpty() public {
        (string[] memory n, address[] memory e, uint256[] memory a, QpayPayroll.PayToken[] memory t, QpayPayroll.PayFrequency[] memory f, uint256[] memory s) = _batchArrays(0);
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.EmptyBatch.selector);
        payroll.batchCreatePayroll(n, e, a, t, f, s);
    }

    function test_BatchCreate_RevertsTooLarge() public {
        (string[] memory n, address[] memory e, uint256[] memory a, QpayPayroll.PayToken[] memory t, QpayPayroll.PayFrequency[] memory f, uint256[] memory s) = _batchArrays(51);
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.BatchTooLarge.selector);
        payroll.batchCreatePayroll(n, e, a, t, f, s);
    }

    function test_BatchCreate_RevertsSizeMismatch() public {
        (string[] memory n, address[] memory e, uint256[] memory a, QpayPayroll.PayToken[] memory t, QpayPayroll.PayFrequency[] memory f,) = _batchArrays(3);
        uint256[] memory s = new uint256[](2);
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.BatchSizeMismatch.selector);
        payroll.batchCreatePayroll(n, e, a, t, f, s);
    }

    function test_BatchCreate_AtomicOnInvalidItem() public {
        (string[] memory n, address[] memory e, uint256[] memory a, QpayPayroll.PayToken[] memory t, QpayPayroll.PayFrequency[] memory f, uint256[] memory s) = _batchArrays(3);
        a[2] = 0;
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.InvalidAmount.selector);
        payroll.batchCreatePayroll(n, e, a, t, f, s);
        assertEq(payroll.getEmployerPayrollCount(employer), 0);
    }

    // ---------- payEmployee ----------
    function test_PayEmployee_TransfersAndMarksPaid() public {
        vm.warp(2000);
        uint256 id = _create(alice, 100e6, T_USDT, 0);
        _pay(id);
        assertEq(usdt.balanceOf(alice), 100e6);
        assertEq(usdt.balanceOf(employer), FUNDS - 100e6);
        QpayPayroll.PayrollEntry memory p = payroll.getPayroll(id);
        assertEq(uint8(p.status), uint8(QpayPayroll.PayStatus.Paid));
        assertEq(p.paidAt, 2000);
    }

    function test_PayEmployee_UsesUsdcForUsdcPayroll() public {
        uint256 id = _create(alice, 50e6, T_USDC, 0);
        _pay(id);
        assertEq(usdc.balanceOf(alice), 50e6);
        assertEq(usdt.balanceOf(alice), 0);
    }

    function test_PayEmployee_EmitsEvent() public {
        vm.warp(3000);
        uint256 id = _create(alice, 100e6, T_USDT, 0);
        vm.expectEmit(true, true, true, true, address(payroll));
        emit QpayPayroll.PayrollPaid(id, employer, alice, 100e6, T_USDT, 3000);
        _pay(id);
    }

    function test_PayEmployee_AllowedAtExactStartDate() public {
        uint256 id = _create(alice, 1e6, T_USDT, 5000);
        vm.warp(5000);
        _pay(id);
        assertEq(usdt.balanceOf(alice), 1e6);
    }

    function test_PayEmployee_RevertsNotDueYet() public {
        vm.warp(100);
        uint256 id = _create(alice, 1e6, T_USDT, 5000);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotDueYet.selector, id, 5000, 100));
        _pay(id);
    }

    function test_PayEmployee_RevertsNotEmployer() public {
        uint256 id = _createDefault();
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.NotPayrollEmployer.selector, id, other));
        payroll.payEmployee(id);
    }

    function test_PayEmployee_RevertsAlreadyPaid() public {
        uint256 id = _createDefault();
        _pay(id);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotPending.selector, id, QpayPayroll.PayStatus.Paid));
        _pay(id);
    }

    function test_PayEmployee_RevertsCancelled() public {
        uint256 id = _createDefault();
        vm.prank(employer);
        payroll.cancelPayroll(id);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotPending.selector, id, QpayPayroll.PayStatus.Cancelled));
        _pay(id);
    }

    function test_PayEmployee_RevertsNotFound() public {
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotFound.selector, 0));
        payroll.payEmployee(0);
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotFound.selector, 1));
        payroll.payEmployee(1);
    }

    function test_PayEmployee_RevertsTokenReturnsFalse() public {
        uint256 id = _createDefault();
        usdt.setReturnFalse(true);
        vm.expectRevert(QpayPayroll.TokenTransferFailed.selector);
        _pay(id);
    }

    function test_PayEmployee_RevertsInsufficientAllowance() public {
        uint256 id = _createDefault();
        vm.prank(employer);
        usdt.approve(address(payroll), 0);
        vm.expectRevert(bytes("allowance"));
        _pay(id);
        assertEq(uint8(payroll.getPayroll(id).status), uint8(QpayPayroll.PayStatus.Pending));
    }

    // ---------- batchPayEmployees ----------
    function test_BatchPay_HappyPath() public {
        _create(alice, 10e6, T_USDT, 0);
        _create(bob, 20e6, T_USDC, 0);
        _create(carol, 30e6, T_USDT, 0);
        vm.prank(employer);
        payroll.batchPayEmployees(_ids(3));
        assertEq(usdt.balanceOf(alice), 10e6);
        assertEq(usdc.balanceOf(bob), 20e6);
        assertEq(usdt.balanceOf(carol), 30e6);
        for (uint256 i = 1; i <= 3; ++i) {
            assertEq(uint8(payroll.getPayroll(i).status), uint8(QpayPayroll.PayStatus.Paid));
        }
    }

    function test_BatchPay_EmitsEventPerPayroll() public {
        _create(alice, 10e6, T_USDT, 0);
        _create(bob, 20e6, T_USDC, 0);
        vm.expectEmit(true, true, true, true, address(payroll));
        emit QpayPayroll.PayrollPaid(1, employer, alice, 10e6, T_USDT, block.timestamp);
        vm.expectEmit(true, true, true, true, address(payroll));
        emit QpayPayroll.PayrollPaid(2, employer, bob, 20e6, T_USDC, block.timestamp);
        vm.prank(employer);
        payroll.batchPayEmployees(_ids(2));
    }

    function test_BatchPay_RevertsEmpty() public {
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.EmptyBatch.selector);
        payroll.batchPayEmployees(new uint256[](0));
    }

    function test_BatchPay_RevertsTooLarge() public {
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.BatchTooLarge.selector);
        payroll.batchPayEmployees(_ids(51));
    }

    function test_BatchPay_AtomicOnInsufficientBalance() public {
        _create(alice, 10e6, T_USDT, 0);
        _create(bob, FUNDS + 1, T_USDC, 0); // exceeds employer USDC balance
        vm.prank(employer);
        vm.expectRevert(bytes("balance"));
        payroll.batchPayEmployees(_ids(2));
        assertEq(usdt.balanceOf(alice), 0, "first transfer rolled back");
        assertEq(uint8(payroll.getPayroll(1).status), uint8(QpayPayroll.PayStatus.Pending));
        assertEq(uint8(payroll.getPayroll(2).status), uint8(QpayPayroll.PayStatus.Pending));
    }

    function test_BatchPay_FalseReturnRevertsBatchPaymentFailedAndRollsBack() public {
        _create(alice, 10e6, T_USDT, 0);
        _create(bob, 20e6, T_USDC, 0);
        usdc.setReturnFalse(true);
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.BatchPaymentFailed.selector, 2));
        payroll.batchPayEmployees(_ids(2));
        assertEq(usdt.balanceOf(alice), 0);
        assertEq(uint8(payroll.getPayroll(1).status), uint8(QpayPayroll.PayStatus.Pending));
    }

    function test_BatchPay_AtomicOnNotDueItem() public {
        _create(alice, 10e6, T_USDT, 0);
        _create(bob, 10e6, T_USDT, block.timestamp + 1 days);
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotDueYet.selector, 2, block.timestamp + 1 days, block.timestamp));
        payroll.batchPayEmployees(_ids(2));
        assertEq(usdt.balanceOf(alice), 0);
    }

    function test_BatchPay_RevertsIfAnyNotOwned() public {
        _createDefault();
        vm.prank(other);
        payroll.createPayroll("o", bob, 1e6, T_USDT, F_ONE, 0);
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.NotPayrollEmployer.selector, 2, employer));
        payroll.batchPayEmployees(_ids(2));
    }

    function test_BatchPay_DuplicateIdRevertsAlreadyPaid() public {
        uint256 id = _createDefault();
        uint256[] memory ids = new uint256[](2);
        ids[0] = id;
        ids[1] = id;
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotPending.selector, id, QpayPayroll.PayStatus.Paid));
        payroll.batchPayEmployees(ids);
    }

    // ---------- cancelPayroll ----------
    function test_Cancel_HappyPathAndEvent() public {
        uint256 id = _createDefault();
        vm.expectEmit(true, true, false, true, address(payroll));
        emit QpayPayroll.PayrollCancelled(id, employer);
        vm.prank(employer);
        payroll.cancelPayroll(id);
        assertEq(uint8(payroll.getPayroll(id).status), uint8(QpayPayroll.PayStatus.Cancelled));
    }

    function test_Cancel_RevertsNotEmployer() public {
        uint256 id = _createDefault();
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.NotPayrollEmployer.selector, id, other));
        payroll.cancelPayroll(id);
    }

    function test_Cancel_RevertsNotPending() public {
        uint256 id = _createDefault();
        _pay(id);
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotPending.selector, id, QpayPayroll.PayStatus.Paid));
        payroll.cancelPayroll(id);
    }

    function test_Cancel_RevertsTwice() public {
        uint256 id = _createDefault();
        vm.startPrank(employer);
        payroll.cancelPayroll(id);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotPending.selector, id, QpayPayroll.PayStatus.Cancelled));
        payroll.cancelPayroll(id);
        vm.stopPrank();
    }

    function test_Cancel_RevertsNotFound() public {
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotFound.selector, 99));
        payroll.cancelPayroll(99);
    }
}
