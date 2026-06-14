import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  discountedPrice: { 
    type: Number, 
    default: null 
  },
  category: { 
    type: String, 
    required: true,
    trim: true
  },
  imageUrl: [{ 
    type: String  // Array of image links (matches your Cloudinary uploads)
  }],
  sellCount: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
export default Product;