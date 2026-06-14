import mongoose from 'mongoose';

const WishlistSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, // Guarantees only ONE wishlist document exists per user
    lowercase: true, 
    trim: true 
  },
  productIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' // References your Product model directly
  }]
}, { timestamps: true });

const Wishlist = mongoose.model('Wishlist', WishlistSchema);
export default Wishlist;