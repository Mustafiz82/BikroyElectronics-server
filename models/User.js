import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  customer: {
    type: Boolean,
    default: false
  },
  isLoggedIn: {
    type: Boolean,
    default: false // You can safely ignore or remove this later once we implement clean JWT authentication
  }
}, { 
  timestamps: true 
});

const User = mongoose.model('User', UserSchema);
export default User;