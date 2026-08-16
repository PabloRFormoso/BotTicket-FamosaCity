const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true },
    staffId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 1000 }
}, { timestamps: true });

module.exports = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);
