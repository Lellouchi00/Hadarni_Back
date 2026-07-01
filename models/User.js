const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String, default: '' },
  level: { type: String, default: 'beginner' },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;
