const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    name: String,
    category: { type: String, enum: ['miss', 'mr'] },
    votes: { type: Number, default: 0 }
});

const UserSchema = new mongoose.Schema({
    userId: { type: Number, unique: true },
    votedMiss: { type: Boolean, default: false },
    votedMr: { type: Boolean, default: false }
});

module.exports = {
    Participant: mongoose.model('Participant', ParticipantSchema),
    User: mongoose.model('User', UserSchema)
};