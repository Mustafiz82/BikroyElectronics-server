import mongoose from 'mongoose';

const BkashCacheSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true // Stored manually as "bkash_token" (acting as a single document)
  },
  id_token: { 
    type: String, 
    required: true 
  },
  refresh_token: { 
    type: String 
  },
  expiry_time: { 
    type: Number, 
    required: true 
  },
  last_token_source: { 
    type: String 
  }
}, { _id: false, timestamps: true });

const BkashCache = mongoose.model('BkashCache', BkashCacheSchema);
export default BkashCache;