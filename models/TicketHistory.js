const mongoose = require('mongoose');

const ticketHistorySchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true },
    staffId: { type: String, required: true },
    channelId: { type: String, default: '' },
    reason: { type: String, default: '' },
    transcriptUrl: { type: String, default: '' },
    verificationCode: { type: String, default: '', index: true },
    verificationUrl: { type: String, default: '' },
    transcriptHash: { type: String, default: '' },
    closedAt: { type: Date, default: Date.now },
    dmChannelId: { type: String, default: '' },
    dmMessageId: { type: String, default: '' },
    rated: { type: Boolean, default: false },
    ratedAt: { type: Date, default: null },
    rating: { type: Number, default: null }
}, { timestamps: true });

module.exports = mongoose.models.TicketHistory || mongoose.model('TicketHistory', ticketHistorySchema);
