import mongoose from 'mongoose';

const CustomerDetailSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  companyName: { type: String },
  address: { type: String, required: true },
  apartMentFloor: { type: String },
  PhoneNumber: { type: String, required: true }
}, { _id: false });

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  title: { type: String },
  price: { type: Number },
  imageUrl: [{ type: String }],
  discountedPrice: { type: Number }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  customerDetail: CustomerDetailSchema,
  cartData: [OrderItemSchema],
  totalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['COD', 'Stripe', 'SSL', 'Bkash'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  orderStatus: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  date: { type: Date, default: Date.now },
  
  trxID: { type: String },
  sslTransactionId: { type: String },
  customerMsisdn: { type: String },
  executedAt: { type: Date }
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);
export default Order;