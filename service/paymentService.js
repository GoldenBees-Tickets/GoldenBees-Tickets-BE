const { Payment, Booking } = require('../models');

class PaymentService {
    static async createPaymentRecord(paymentData) {
        return await Payment.create(paymentData);
    }

    static async updatePaymentStatus(orderId, status, transactionData) {
        const payment = await Payment.findOne({ where: { orderId } });
        if (!payment) return null;
        
        return await payment.update({
            status,
            ...transactionData
        });
    }

    static async checkPaymentStatus(orderId) {
        // ...existing checkPaymentStatus logic...
    }
}

module.exports = PaymentService;