const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  movieName: {
    type: String,
    required: true
  },
  showTime: {
    type: Date,
    required: true
  },
  seat: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'used', 'cancelled'],
    default: 'pending'
  },
  usedAt: {
    type: Date
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ticket1', ticketSchema); 