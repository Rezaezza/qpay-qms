// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {QpayPayrollTestBase} from "./QpayPayroll.Base.t.sol";
import {QpayPayroll} from "../QpayPayroll.sol";

contract QpayPayrollRecordsTest is QpayPayrollTestBase {
    bytes32 internal constant H1 = keccak256("tx1");
    bytes32 internal constant H2 = keccak256("tx2");

    function _paidId() internal returns (uint256 id) {
        id = _createDefault();
        _pay(id);
    }

    // ---------- recordPaymentTx ----------
    function test_Record_HappyPathAndEvent() public {
        uint256 id = _paidId();
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        vm.expectEmit(true, true, false, true, address(payroll));
        emit QpayPayroll.PaymentTxRecorded(id, employer, H1);
        vm.prank(employer);
        payroll.recordPaymentTx(ids, H1);
        assertEq(payroll.getPayroll(id).txRef, H1);
    }

    function test_Record_BatchOfIdsOneHash() public {
        _create(alice, 1e6, T_USDT, 0);
        _create(bob, 1e6, T_USDC, 0);
        _create(carol, 1e6, T_USDT, 0);
        vm.prank(employer);
        payroll.batchPayEmployees(_ids(3));

        vm.expectEmit(true, true, false, true, address(payroll));
        emit QpayPayroll.PaymentTxRecorded(1, employer, H1);
        vm.expectEmit(true, true, false, true, address(payroll));
        emit QpayPayroll.PaymentTxRecorded(2, employer, H1);
        vm.expectEmit(true, true, false, true, address(payroll));
        emit QpayPayroll.PaymentTxRecorded(3, employer, H1);
        vm.prank(employer);
        payroll.recordPaymentTx(_ids(3), H1);

        bytes32[] memory hs = payroll.getPaymentTxHashes(_ids(3));
        assertEq(hs.length, 3);
        for (uint256 i = 0; i < 3; ++i) assertEq(hs[i], H1);
    }

    function test_Record_RevertsNotEmployer() public {
        uint256 id = _paidId();
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.NotPayrollEmployer.selector, id, other));
        payroll.recordPaymentTx(ids, H1);
    }

    function test_Record_RevertsPendingNotPaid() public {
        uint256 id = _createDefault();
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotPaid.selector, id, QpayPayroll.PayStatus.Pending));
        payroll.recordPaymentTx(ids, H1);
    }

    function test_Record_RevertsCancelledNotPaid() public {
        uint256 id = _createDefault();
        vm.startPrank(employer);
        payroll.cancelPayroll(id);
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotPaid.selector, id, QpayPayroll.PayStatus.Cancelled));
        payroll.recordPaymentTx(ids, H1);
        vm.stopPrank();
    }

    function test_Record_WriteOnce() public {
        uint256 id = _paidId();
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        vm.startPrank(employer);
        payroll.recordPaymentTx(ids, H1);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PaymentTxAlreadyRecorded.selector, id));
        payroll.recordPaymentTx(ids, H2);
        vm.stopPrank();
        assertEq(payroll.getPayroll(id).txRef, H1);
    }

    function test_Record_RevertsZeroHash() public {
        uint256 id = _paidId();
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.InvalidTxHash.selector);
        payroll.recordPaymentTx(ids, bytes32(0));
    }

    function test_Record_RevertsEmptyBatch() public {
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.EmptyBatch.selector);
        payroll.recordPaymentTx(new uint256[](0), H1);
    }

    function test_Record_RevertsTooLarge() public {
        vm.prank(employer);
        vm.expectRevert(QpayPayroll.BatchTooLarge.selector);
        payroll.recordPaymentTx(_ids(51), H1);
    }

    function test_Record_RevertsNotFound() public {
        uint256[] memory ids = new uint256[](1);
        ids[0] = 42;
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotFound.selector, 42));
        payroll.recordPaymentTx(ids, H1);
    }

    function test_Record_AtomicWhenOneIdAlreadyRecorded() public {
        _create(alice, 1e6, T_USDT, 0);
        _create(bob, 1e6, T_USDT, 0);
        vm.startPrank(employer);
        payroll.batchPayEmployees(_ids(2));
        uint256[] memory one = new uint256[](1);
        one[0] = 2;
        payroll.recordPaymentTx(one, H1);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PaymentTxAlreadyRecorded.selector, 2));
        payroll.recordPaymentTx(_ids(2), H2);
        vm.stopPrank();
        assertEq(payroll.getPayroll(1).txRef, bytes32(0), "id 1 write rolled back");
    }

    function test_Record_DuplicateIdInBatchReverts() public {
        uint256 id = _paidId();
        uint256[] memory ids = new uint256[](2);
        ids[0] = id;
        ids[1] = id;
        vm.prank(employer);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PaymentTxAlreadyRecorded.selector, id));
        payroll.recordPaymentTx(ids, H1);
    }

    // ---------- getPaymentTxHashes ----------
    function test_GetHashes_ZeroForUnrecorded() public {
        _createDefault();
        bytes32[] memory hs = payroll.getPaymentTxHashes(_ids(1));
        assertEq(hs[0], bytes32(0));
    }

    function test_GetHashes_EmptyInputReturnsEmpty() public view {
        assertEq(payroll.getPaymentTxHashes(new uint256[](0)).length, 0);
    }

    function test_GetHashes_RevertsNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotFound.selector, 5));
        payroll.getPaymentTxHashes(_toArr(5));
    }

    function _toArr(uint256 x) internal pure returns (uint256[] memory a) {
        a = new uint256[](1);
        a[0] = x;
    }

    // ---------- getters ----------
    function test_GetPayroll_RevertsNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotFound.selector, 1));
        payroll.getPayroll(1);
    }

    function test_GetPayrollBatch() public {
        _create(alice, 1e6, T_USDT, 0);
        _create(bob, 2e6, T_USDC, 0);
        QpayPayroll.PayrollEntry[] memory es = payroll.getPayrollBatch(_ids(2));
        assertEq(es.length, 2);
        assertEq(es[0].employee, alice);
        assertEq(es[1].amount, 2e6);
    }

    function test_GetPayrollBatch_RevertsNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotFound.selector, 1));
        payroll.getPayrollBatch(_ids(1));
    }

    function test_EmployerCountAndIsolation() public {
        _createDefault();
        _createDefault();
        vm.prank(other);
        payroll.createPayroll("o", bob, 1e6, T_USDT, F_ONE, 0);
        assertEq(payroll.getEmployerPayrollCount(employer), 2);
        assertEq(payroll.getEmployerPayrollCount(other), 1);
        assertEq(payroll.getEmployerPayrollCount(alice), 0);
    }

    // ---------- pagination ----------
    function _createMany(uint256 n) internal {
        for (uint256 i = 0; i < n; ++i) _createDefault();
    }

    function test_Page_Basic() public {
        _createMany(5);
        uint256[] memory p = payroll.getEmployerPayrollsPage(employer, 1, 2);
        assertEq(p.length, 2);
        assertEq(p[0], 2);
        assertEq(p[1], 3);
    }

    function test_Page_LastPartial() public {
        _createMany(5);
        uint256[] memory p = payroll.getEmployerPayrollsPage(employer, 3, 10);
        assertEq(p.length, 2);
        assertEq(p[0], 4);
        assertEq(p[1], 5);
    }

    function test_Page_OffsetAtOrPastEndReturnsEmpty() public {
        _createMany(3);
        assertEq(payroll.getEmployerPayrollsPage(employer, 3, 10).length, 0);
        assertEq(payroll.getEmployerPayrollsPage(employer, 1000, 10).length, 0);
        assertEq(payroll.getEmployerPayrollsPage(employer, type(uint256).max, 10).length, 0);
    }

    function test_Page_ZeroLimitReturnsEmpty() public {
        _createMany(3);
        assertEq(payroll.getEmployerPayrollsPage(employer, 0, 0).length, 0);
    }

    function test_Page_UnknownEmployerEmpty() public view {
        assertEq(payroll.getEmployerPayrollsPage(alice, 0, 10).length, 0);
    }

    function test_Page_LimitCappedAt100() public {
        // create 120 payrolls via 3 batches of 40
        for (uint256 b = 0; b < 3; ++b) {
            (string[] memory n, address[] memory e, uint256[] memory a, QpayPayroll.PayToken[] memory t, QpayPayroll.PayFrequency[] memory f, uint256[] memory s) = _batchArrays(40);
            vm.prank(employer);
            payroll.batchCreatePayroll(n, e, a, t, f, s);
        }
        assertEq(payroll.getEmployerPayrollCount(employer), 120);
        uint256[] memory p = payroll.getEmployerPayrollsPage(employer, 0, 1000);
        assertEq(p.length, 100);
        assertEq(p[0], 1);
        assertEq(p[99], 100);
        uint256[] memory p2 = payroll.getEmployerPayrollsPage(employer, 100, 1000);
        assertEq(p2.length, 20);
        assertEq(p2[19], 120);
    }

    // ---------- fuzz ----------
    function testFuzz_PayEmployee_MovesExactAmount(uint256 amount, bool useUsdc) public {
        amount = bound(amount, 1, FUNDS);
        QpayPayroll.PayToken t = useUsdc ? T_USDC : T_USDT;
        uint256 id = _create(alice, amount, t, 0);
        _pay(id);
        MockBal memory b = _bal(useUsdc);
        assertEq(b.alice, amount);
        assertEq(b.employer, FUNDS - amount);
        assertEq(b.payroll, 0);
        assertEq(uint8(payroll.getPayroll(id).status), uint8(QpayPayroll.PayStatus.Paid));
    }

    function testFuzz_PayEmployee_RevertsWhenAmountExceedsBalance(uint256 amount) public {
        amount = bound(amount, FUNDS + 1, type(uint128).max);
        uint256 id = _create(alice, amount, T_USDT, 0);
        vm.expectRevert(bytes("balance"));
        _pay(id);
    }

    function testFuzz_NotDueUntilStart(uint256 start, uint256 nowTs) public {
        start = bound(start, 2, type(uint64).max);
        nowTs = bound(nowTs, 1, start - 1);
        vm.warp(nowTs);
        uint256 id = _create(alice, 1e6, T_USDT, start);
        vm.expectRevert(abi.encodeWithSelector(QpayPayroll.PayrollNotDueYet.selector, id, start, nowTs));
        _pay(id);
        vm.warp(start);
        _pay(id);
        assertEq(usdt.balanceOf(alice), 1e6);
    }

    function testFuzz_BatchPay_ConservesFunds(uint8 count, uint256 seed) public {
        uint256 n = bound(count, 1, 50);
        uint256 total;
        for (uint256 i = 0; i < n; ++i) {
            uint256 amt = bound(uint256(keccak256(abi.encode(seed, i))), 1, 1000e6);
            total += amt;
            _create(address(uint160(0x2000 + i)), amt, T_USDT, 0);
        }
        vm.prank(employer);
        payroll.batchPayEmployees(_ids(n));
        assertEq(usdt.balanceOf(employer), FUNDS - total);
        assertEq(usdt.balanceOf(address(payroll)), 0);
        uint256 recv;
        for (uint256 i = 0; i < n; ++i) recv += usdt.balanceOf(address(uint160(0x2000 + i)));
        assertEq(recv, total);
    }

    function testFuzz_Page_ConsistentWithFullList(uint8 count, uint256 offset, uint256 limit) public {
        uint256 n = bound(count, 0, 30);
        _createMany(n);
        offset = bound(offset, 0, 40);
        limit = bound(limit, 0, 150);
        uint256[] memory p = payroll.getEmployerPayrollsPage(employer, offset, limit);
        uint256 cap = limit > 100 ? 100 : limit;
        uint256 expected = offset >= n ? 0 : (n - offset > cap ? cap : n - offset);
        assertEq(p.length, expected);
        for (uint256 i = 0; i < p.length; ++i) assertEq(p[i], offset + i + 1);
    }

    struct MockBal {
        uint256 alice;
        uint256 employer;
        uint256 payroll;
    }

    function _bal(bool useUsdc) internal view returns (MockBal memory b) {
        if (useUsdc) {
            b = MockBal(usdc.balanceOf(alice), usdc.balanceOf(employer), usdc.balanceOf(address(payroll)));
        } else {
            b = MockBal(usdt.balanceOf(alice), usdt.balanceOf(employer), usdt.balanceOf(address(payroll)));
        }
    }
}
