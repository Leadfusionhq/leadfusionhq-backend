const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const BillingServices = require('../../services/billing/billing.service.js');
const { ErrorHandler } = require('../../utils/error-handler');
const { getPaginationParams, extractFilters } = require('../../utils/pagination');
const { User } = require('../../models/user.model');
const { billingLogger } = require('../../utils/logger');
const dayjs = require('dayjs');
const path = require('path');
const { URL } = require('url');

const { generateTransactionReceipt } = require('../../services/pdf/receiptGenerator');

const Transaction = require('../../models/transaction.model');


const MAIL_HANDLER = require('../../mail/mails');


const { getRevenueFromNmi, getRefundsFromNmi } = require('../../services/nmi/nmi.service'); // import

// Contract management
const getCurrentContract = wrapAsync(async (req, res) => {
    billingLogger.info('Getting current contract');
    const contract = await BillingServices.getCurrentContract();
    billingLogger.info('Current contract retrieved successfully');
    return sendResponse(res, { contract }, 'Current contract retrieved successfully');
});

const getContractStatus = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    billingLogger.info('Getting contract status for user', { userId: user_id });
    const status = await BillingServices.getUserContractStatus(user_id);
    billingLogger.info('Contract status retrieved successfully', { userId: user_id, status });
    return sendResponse(res, { status }, 'Contract status retrieved successfully');
});


// ✅ Add this controller
const getRevenueFromGateway = wrapAsync(async (req, res) => {
    const { range = 'mtd', start, end, includeRefunds = '0' } = req.query;

    let from = dayjs().startOf('month');
    let to = dayjs().endOf('day');
    if (range === 'today') { from = dayjs().startOf('day'); to = dayjs().endOf('day'); }
    if (range === '7d') { from = dayjs().subtract(6, 'day').startOf('day'); to = dayjs().endOf('day'); }
    if (range === '30d') { from = dayjs().subtract(29, 'day').startOf('day'); to = dayjs().endOf('day'); }
    if (range === 'custom' && start && end) {
        from = dayjs(start).startOf('day');
        to = dayjs(end).endOf('day');
    }
    // 🔥 NEW RANGES ADDED
    if (range === 'yesterday') {
        from = dayjs().subtract(1, 'day').startOf('day');
        to = dayjs().subtract(1, 'day').endOf('day');
    }

    if (range === 'this_year') {
        from = dayjs().startOf('year');
        to = dayjs().endOf('day');
    }

    if (range === 'last_year') {
        from = dayjs().subtract(1, 'year').startOf('year');
        to = dayjs().subtract(1, 'year').endOf('year');
    }

    if (range === 'q1') {
        from = dayjs().month(0).startOf('month');   // Jan 1
        to = dayjs().month(2).endOf('month');       // Mar 31
    }

    if (range === 'q2') {
        from = dayjs().month(3).startOf('month');   // Apr 1
        to = dayjs().month(5).endOf('month');       // Jun 30
    }

    if (range === 'q3') {
        from = dayjs().month(6).startOf('month');   // Jul 1
        to = dayjs().month(8).endOf('month');       // Sep 30
    }

    if (range === 'q4') {
        from = dayjs().month(9).startOf('month');   // Oct 1
        to = dayjs().month(11).endOf('month');      // Dec 31
    }


    const { totalAmount: sales, count: salesCount } = await getRevenueFromNmi({ start: from, end: to });

    let refunds = 0;
    let refundCount = 0;
    if (includeRefunds === '1') {
        const r = await getRefundsFromNmi({ start: from, end: to });
        refunds = r.totalAmount;
        refundCount = r.count;
    }

    const totalAmount = sales - refunds;

    return sendResponse(res, {
        totalAmount,
        sales,
        refunds,
        salesCount,
        refundCount,
        from: from.toISOString(),
        to: to.toISOString()
    }, 'Revenue fetched successfully');
});


const acceptContract = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { version, ipAddress } = req.body;

    billingLogger.info('User attempting to accept contract', {
        userId: user_id,
        version,
        ipAddress
    });

    try {
        const result = await BillingServices.acceptContract(user_id, version, ipAddress);
        billingLogger.info('Contract accepted successfully', {
            userId: user_id,
            version,
            result
        });
        return sendResponse(res, { result }, 'Contract accepted successfully', 201);
    } catch (err) {
        billingLogger.error('Failed to accept contract', err, {
            userId: user_id,
            version,
            ipAddress
        });
        throw new ErrorHandler(500, 'Failed to accept contract. Please try again later.');
    }
});

// Card management
const saveCard = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const email = req.user.email;

    // const contractStatus = await BillingServices.getUserContractStatus(user_id);
    // if (!contractStatus.hasAcceptedLatest) {
    //     throw new ErrorHandler(400, 'You must accept the latest contract before saving payment information.');
    // }

    const { makeDefault = true } = req.body;
    const cardData = { ...req.body, user_id, email };

    billingLogger.info('User attempting to save card', {
        userId: user_id,
        cardLast4: req.body.ccnumber ? req.body.ccnumber.slice(-4) : 'N/A',
        makeDefault
    });

    try {
        const data = await BillingServices.saveCard(cardData, makeDefault);
        billingLogger.info('Card details saved successfully', {
            userId: user_id,
            vaultId: data.customerVaultId
        });
        return sendResponse(res, { data }, 'Your card details have been saved', 201);
    } catch (err) {
        billingLogger.error('Failed to save card', err, { userId: user_id });

        if (err.statusCode) {
            throw err;
        }

        throw new ErrorHandler(500, 'Failed to save your card details. Please try again later.');
    }
});

// Get all user cards
const getCards = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    console.log(req);
    const user = await User.findById(user_id);
    if (!user) throw new ErrorHandler(404, 'User not found');

    return sendResponse(res, { cards: user.paymentMethods }, 'Cards retrieved successfully');
});

// Set default card
const setDefaultCard = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { vaultId } = req.body;

    const user = await User.findById(user_id);
    if (!user) throw new ErrorHandler(404, 'User not found');

    // Find the card
    const card = user.paymentMethods.find(pm => pm.customerVaultId === vaultId);
    if (!card) throw new ErrorHandler(404, 'Card not found');

    // Update all cards to not default
    user.paymentMethods.forEach(pm => {
        pm.isDefault = pm.customerVaultId === vaultId;
    });

    // Set the selected card as default
    user.defaultPaymentMethod = vaultId;

    await user.save();

    return sendResponse(res, { defaultCard: card }, 'Default card updated successfully');
});

// Delete card


const deleteCard = wrapAsync(async (req, res) => {
    const userId = req.user._id;
    const { vaultId } = req.params;

    const result = await BillingServices.deleteUserCard(userId, vaultId);

    return sendResponse(res, { nmiResponse: result.nmiResponse }, result.message);
});

const testAutoTopUp = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { deductAmount } = req.body;

    billingLogger.info('Testing auto top-up for user', { userId: user_id, deductAmount });

    try {
        const result = await BillingServices.testLeadDeduction(user_id, deductAmount);

        // ✅ Send auto top-up email if triggered
        if (result.autoTopUpTriggered) {
            try {
                const user = await User.findById(user_id);
                await MAIL_HANDLER.sendAutoTopUpEmail({
                    to: user.email,
                    userName: user.name,
                    amount: result.topUpAmount,
                    transactionId: result.topUpTransactionId,
                    triggerReason: `Balance below threshold after lead deduction`,
                    newBalance: result.newBalance,
                    threshold: result.threshold || 50
                });
                billingLogger.info('Auto top-up email sent', { userId: user_id });
            } catch (emailErr) {
                billingLogger.error('Failed to send auto top-up email', emailErr);
            }
        }

        billingLogger.info('Auto top-up test completed', {
            userId: user_id,
            deductAmount,
            result: result.message
        });

        return sendResponse(res, { result }, result.message);
    } catch (err) {
        billingLogger.error('Failed to process lead deduction', err, { userId: user_id, deductAmount });

        if (err.statusCode === 400) {
            throw new ErrorHandler(400, err.message);
        }

        throw new ErrorHandler(500, 'Failed to process lead deduction. Please try again later.');
    }
});




// Billing operations
// Update addFunds function
const addFunds = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { amount, vaultId } = req.body;

    billingLogger.info('User attempting to add funds', { userId: user_id, amount });

    const contractStatus = await BillingServices.getUserContractStatus(user_id);
    if (!contractStatus.hasAcceptedLatest) {
        billingLogger.warn('User tried to add funds without accepting contract', { userId: user_id, amount });
        throw new ErrorHandler(400, 'You must accept the latest contract before adding funds.');
    }

    try {
        const result = await BillingServices.addFunds(user_id, amount, vaultId);
        billingLogger.info('Funds added successfully', {
            userId: user_id,
            amount,
            transactionId: result.transactionId
        });

        // ✅ Send funds added email
        try {
            const user = await User.findById(user_id);
            await MAIL_HANDLER.sendFundsAddedEmail({
                to: user.email,
                userName: user.name,
                amount: amount,
                transactionId: result.transactionId,
                paymentMethod: result.paymentMethod || 'Card',
                newBalance: result.newBalance
            });
            billingLogger.info('Funds added email sent', { userId: user_id });
        } catch (emailErr) {
            billingLogger.error('Failed to send funds added email', emailErr);
        }

        return sendResponse(res, { result }, 'Funds added successfully', 201);
    } catch (err) {
        billingLogger.error('Failed to add funds', err, { userId: user_id, amount });

        if (err.statusCode === 400) {
            throw new ErrorHandler(400, err.message);
        }

        throw new ErrorHandler(500, 'Failed to add funds. Please try again later.');
    }
});

const assignLead = wrapAsync(async (req, res) => {
    const { userId, leadId, leadCost } = req.body;
    const assignedBy = req.user._id;

    try {
        const result = await BillingServices.assignLead(userId, leadId, leadCost, assignedBy);
        return sendResponse(res, { result }, 'Lead assigned successfully', 201);
    } catch (err) {
        console.error(`Failed to assign lead:`, err.message);
        throw new ErrorHandler(500, 'Failed to assign lead. Please try again later.');
    }
});

const chargeUser = wrapAsync(async (req, res) => {
    const { userId, amount, note } = req.body;
    const chargedBy = req.user._id;

    try {
        const result = await BillingServices.manualCharge(userId, amount, note, chargedBy);
        return sendResponse(res, { result }, 'User charged successfully', 201);
    } catch (err) {
        console.error(`Failed to charge user:`, err.message);
        throw new ErrorHandler(500, 'Failed to charge user. Please try again later.');
    }
});

// Account information
const getBalance = wrapAsync(async (req, res) => {
    const user_id = req.user._id;

    try {
        const balance = await BillingServices.getUserBalance(user_id);
        return sendResponse(res, { balance }, 'Balance retrieved successfully');
    } catch (err) {
        console.error(`Failed to get balance:`, err.message);
        throw new ErrorHandler(500, 'Failed to retrieve balance. Please try again later.');
    }
});

const getTransactions = wrapAsync(async (req, res) => {
    const user_id = req.query.userId || req.user?._id
    const { page, limit } = getPaginationParams(req.query);
    const filters = extractFilters(req.query, ['type', 'status', 'dateFrom', 'dateTo']);

    try {
        const transactions = await BillingServices.getUserTransactions(user_id, page, limit, filters);
        return sendResponse(res, {
            transactions: transactions.transactions,
            pagination: transactions.pagination
        }, 'Transactions retrieved successfully');
    } catch (err) {
        console.error(`Failed to get transactions:`, err.message);

        // Check if it's a known error or a database error
        if (err.message.includes('Failed to retrieve transactions')) {
            throw new ErrorHandler(500, 'Failed to retrieve transactions. Please try again later.');
        } else {
            throw new ErrorHandler(400, 'Invalid request parameters.');
        }
    }
});


// Update the toggleAutoTopUp function:
const toggleAutoTopUp = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { paymentMode, enabled } = req.body; // ✅ Accept enabled from request

    try {
        const result = await BillingServices.updatePaymentMode(user_id, {
            paymentMode,
            enabled // ✅ Pass enabled to service
        });

        const statusText = enabled ? 'enabled' : 'disabled';
        return sendResponse(res, { result }, `Payment mode updated to ${paymentMode} (auto top-up ${statusText})`);
    } catch (err) {
        console.error(`Failed to update payment mode:`, err.message);
        throw new ErrorHandler(500, 'Failed to update payment mode. Please try again later.');
    }
});

// Build a sensible logoPath from env or local fallback
const getLogoPath = () => {
    // Highest priority: explicit company logo URL
    if (process.env.COMPANY_LOGO_URL) return process.env.COMPANY_LOGO_URL;

    // Next: UI_LINK + /images/logo.png
    if (process.env.UI_LINK) {
        try {
            return new URL('/images/logo.png', process.env.UI_LINK).toString();
        } catch (_) { /* ignore */ }
    }

    // Fallback to local file (if running on a server with the asset available)
    return path.join(process.cwd(), 'public', 'images', 'logo.png');
};

const getReceipt = async (req, res, next) => {
    try {
        const { txnId } = req.params;
        const mobile = req.query.mobile === '1';
        const download = req.query.download !== '0'; // default to download; use ?download=0 for inline

        // Find by custom transaction_id or by ObjectId
        let txn = await Transaction.findOne({ transaction_id: txnId }).lean();
        if (!txn) txn = await Transaction.findById(txnId).lean();
        if (!txn) return res.status(404).json({ message: 'Receipt not found' });

        const userId = txn.userId || txn.user_id;
        const user = userId ? await User.findById(userId).lean() : null;

        const logoPath = getLogoPath();

        const pdf = await generateTransactionReceipt({
            transactionId: txn.transaction_id || String(txn._id),
            userName: user?.name || 'Customer',
            userEmail: user?.email || '',
            transactionType: txn.description || txn.type || 'Transaction',
            amount: Number(txn.amount || 0),
            date: new Date(txn.createdAt || Date.now()).toLocaleString(),
            newBalance: txn.balance_after ?? txn.balanceAfter ?? 0,
            oldBalance: txn.balance_before ?? txn.balanceBefore ?? undefined,
            description: txn.description || '',
            paymentMethod: txn.paymentMethodDetails
                ? `${txn.paymentMethodDetails.brand || 'Card'} •••• ${txn.paymentMethodDetails.lastFour || ''}`
                : (txn.paymentMethod || ''),
            logoPath, // <- pass your logo
            mobile
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `${download ? 'attachment' : 'inline'}; filename="receipt-${txnId}.pdf"`
        );
        res.setHeader('Cache-Control', 'private, max-age=60');

        return res.send(pdf);
    } catch (err) {
        return next(err);
    }
};


const chargeSingleLead = wrapAsync(async (req, res) => {
    const { leadId } = req.params;
    const user_id = req.user._id;
    const email = req.user.email;

    billingLogger.info('User attempting to charge single lead', {
        userId: user_id,
        leadId
    });

    try {
        const result = await BillingServices.chargeSingleLead(user_id, leadId);

        if (!result.success) {
            billingLogger.warn('Lead charge failed', {
                userId: user_id,
                leadId,
                error: result.error,
                message: result.message
            });

            return sendResponse(
                res,
                {
                    error: result.error,
                    details: result
                },
                result.message || 'Failed to charge lead',
                400
            );
        }

        billingLogger.info('Lead charged successfully', {
            userId: user_id,
            leadId,
            paymentMethod: result.paymentMethod,
            transactionId: result.transactionId
        });

        return sendResponse(
            res,
            { result },
            result.message || 'Lead payment completed successfully',
            200
        );

    } catch (err) {
        billingLogger.error('Failed to charge lead', err, {
            userId: user_id,
            leadId,
            email
        });
        throw new ErrorHandler(500, 'Failed to charge lead. Please try again later.');
    }
});

module.exports = {
    chargeSingleLead,
    getCurrentContract,
    getContractStatus,
    acceptContract,
    saveCard,
    addFunds,
    assignLead,
    chargeUser,
    getBalance,
    getTransactions,
    toggleAutoTopUp,
    getCards,
    setDefaultCard,
    deleteCard,
    testAutoTopUp,
    getRevenueFromGateway,
    getReceipt,
};
