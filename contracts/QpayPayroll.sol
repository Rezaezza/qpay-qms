// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract QpayPayroll is ReentrancyGuard {
    enum PayFrequency {
        OneTime,
        Weekly,
        Monthly
    }

    enum PayToken {
        USDT,
        USDC
    }

    enum PayStatus {
        Pending,
        Paid,
        Cancelled
    }

    struct PayrollEntry {
        uint256 id;
        address employer;
        string employeeName;
        address employee;
        uint256 amount;
        PayToken token;
        PayFrequency frequency;
        uint256 startDate;
        PayStatus status;
        uint256 createdAt;
        uint256 paidAt;
        bytes32 txRef;
    }

    error InvalidEmployee();
    error InvalidAmount();
    error PayrollNotFound(uint256 payrollId);
    error NotPayrollEmployer(uint256 payrollId, address caller);
    error PayrollNotPending(uint256 payrollId, PayStatus status);
    error PayrollNotDueYet(uint256 payrollId, uint256 startDate, uint256 currentTime);
    error TokenTransferFailed();
    error InvalidToken();
    error ZeroTokenAddress();
    error BatchSizeMismatch();
    error BatchTooLarge();
    error EmptyBatch();
    error BatchPaymentFailed(uint256 payrollId);

    event PayrollCreated(
        uint256 indexed id,
        address indexed employer,
        address indexed employee,
        uint256 amount,
        PayToken token,
        PayFrequency frequency,
        uint256 startDate
    );

    event PayrollPaid(
        uint256 indexed id,
        address indexed employer,
        address indexed employee,
        uint256 amount,
        PayToken token,
        uint256 paidAt
    );

    event PayrollCancelled(uint256 indexed id, address indexed employer);

    address public immutable USDT_TOKEN;
    address public immutable USDC_TOKEN;

    uint256 private _nextPayrollId = 1;

    mapping(uint256 => PayrollEntry) private _payrolls;
    mapping(address => uint256[]) private _employerPayrollIds;

    constructor(address usdtAddress, address usdcAddress) {
        if (usdtAddress == address(0) || usdcAddress == address(0)) revert ZeroTokenAddress();
        USDT_TOKEN = usdtAddress;
        USDC_TOKEN = usdcAddress;
    }

    function createPayroll(
        string calldata employeeName,
        address employee,
        uint256 amount,
        PayToken token,
        PayFrequency frequency,
        uint256 startDate
    ) external returns (uint256 id) {
        id = _createSinglePayroll(employeeName, employee, amount, token, frequency, startDate);
    }

    function batchCreatePayroll(
        string[] calldata employeeNames,
        address[] calldata employees,
        uint256[] calldata amounts,
        PayToken[] calldata tokens,
        PayFrequency[] calldata frequencies,
        uint256[] calldata startDates
    ) external returns (uint256[] memory ids) {
        uint256 length = employeeNames.length;
        if (length == 0) revert EmptyBatch();
        if (length > 50) revert BatchTooLarge();
        if (
            employees.length != length ||
            amounts.length != length ||
            tokens.length != length ||
            frequencies.length != length ||
            startDates.length != length
        ) revert BatchSizeMismatch();

        ids = new uint256[](length);

        for (uint256 i = 0; i < length; ++i) {
            ids[i] = _createSinglePayroll(employeeNames[i], employees[i], amounts[i], tokens[i], frequencies[i], startDates[i]);
        }
    }

    function payEmployee(uint256 payrollId) external nonReentrant {
        _paySingleEmployee(payrollId);
    }

    function batchPayEmployees(uint256[] calldata payrollIds) external nonReentrant {
        uint256 length = payrollIds.length;
        if (length == 0) revert EmptyBatch();
        if (length > 50) revert BatchTooLarge();

        for (uint256 i = 0; i < length; ++i) {
            _paySingleEmployee(payrollIds[i], true);
        }
    }

    function cancelPayroll(uint256 payrollId) external {
        PayrollEntry storage payroll = _payrollById(payrollId);

        if (payroll.employer != msg.sender) revert NotPayrollEmployer(payrollId, msg.sender);
        if (payroll.status != PayStatus.Pending) revert PayrollNotPending(payrollId, payroll.status);

        payroll.status = PayStatus.Cancelled;

        emit PayrollCancelled(payrollId, msg.sender);
    }

    function getEmployerPayrolls(address employer) external view returns (uint256[] memory) {
        return _employerPayrollIds[employer];
    }

    function getPayroll(uint256 id) external view returns (PayrollEntry memory) {
        PayrollEntry storage payroll = _payrollById(id);
        return payroll;
    }

    function getPayrollBatch(uint256[] calldata ids) external view returns (PayrollEntry[] memory entries) {
        uint256 length = ids.length;
        entries = new PayrollEntry[](length);

        for (uint256 i = 0; i < length; ++i) {
            entries[i] = _payrollById(ids[i]);
        }
    }

    function _createSinglePayroll(
        string calldata employeeName,
        address employee,
        uint256 amount,
        PayToken token,
        PayFrequency frequency,
        uint256 startDate
    ) internal returns (uint256 id) {
        if (employee == address(0)) revert InvalidEmployee();
        if (amount == 0) revert InvalidAmount();

        id = _nextPayrollId;
        _nextPayrollId = id + 1;

        _payrolls[id] = PayrollEntry({
            id: id,
            employer: msg.sender,
            employeeName: employeeName,
            employee: employee,
            amount: amount,
            token: token,
            frequency: frequency,
            startDate: startDate,
            status: PayStatus.Pending,
            createdAt: block.timestamp,
            paidAt: 0,
            txRef: bytes32(0)
        });

        _employerPayrollIds[msg.sender].push(id);

        emit PayrollCreated(id, msg.sender, employee, amount, token, frequency, startDate);
    }

    function _paySingleEmployee(uint256 payrollId) internal {
        _paySingleEmployee(payrollId, false);
    }

    function _paySingleEmployee(uint256 payrollId, bool isBatchPayment) internal {
        PayrollEntry storage payroll = _payrollById(payrollId);

        if (payroll.employer != msg.sender) revert NotPayrollEmployer(payrollId, msg.sender);
        if (payroll.status != PayStatus.Pending) revert PayrollNotPending(payrollId, payroll.status);
        if (block.timestamp < payroll.startDate) revert PayrollNotDueYet(payrollId, payroll.startDate, block.timestamp);

        address tokenAddress = _tokenAddress(payroll.token);
        bool success = IERC20(tokenAddress).transferFrom(msg.sender, payroll.employee, payroll.amount);
        if (!success) {
            if (isBatchPayment) revert BatchPaymentFailed(payrollId);
            revert TokenTransferFailed();
        }

        payroll.status = PayStatus.Paid;
        payroll.paidAt = block.timestamp;

        emit PayrollPaid(
            payrollId,
            msg.sender,
            payroll.employee,
            payroll.amount,
            payroll.token,
            payroll.paidAt
        );
    }

    function _payrollById(uint256 payrollId) internal view returns (PayrollEntry storage payroll) {
        if (payrollId == 0 || payrollId >= _nextPayrollId) revert PayrollNotFound(payrollId);
        payroll = _payrolls[payrollId];
    }

    function _tokenAddress(PayToken token) internal view returns (address tokenAddress) {
        if (token == PayToken.USDT) return USDT_TOKEN;
        if (token == PayToken.USDC) return USDC_TOKEN;
        revert InvalidToken();
    }
}
