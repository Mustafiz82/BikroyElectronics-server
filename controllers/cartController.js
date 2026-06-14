import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';

export const addToCart = async (req, res) => {
  try {
    const { productId, email, quantity } = req.body;

    if (!productId || !email) {
      return res.status(400).json({ message: "productId and email are required" });
    }
    const normalizedEmail = email.toLowerCase();

    // Check if item already exists in the cart
    const checkProduct = await Cart.findOne({ productId, email: normalizedEmail });

    if (!checkProduct) {
      const newCartItem = new Cart({
        productId,
        email: normalizedEmail,
        quantity: quantity || 1
      });
      const result = await newCartItem.save();
      res.status(201).json(result);
    } else {
      res.status(409).json({
        message: "Product already exists in the cart",
      });
    }
  } catch (error) { 
    res.status(500).json({ message: error.message });
  }
};

// 2. View cart (Joins Product collection dynamically and flattens for frontend compatibility)
export const getCartByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email query parameter is required" });
    }

    // Fetch cart documents and populate product fields
    const cartItems = await Cart.find({ email: email.toLowerCase() })
      .populate('productId')
      .lean();

    // Flatten the populated fields so your React frontend receives the exact flat keys it expects
    const flattenedCart = cartItems.map(item => {
      const product = item.productId;

      // Safety check if a product was deleted from the admin panel but still exists in their cart
      if (!product) {
        return {
          _id: item._id,
          productId: null,
          email: item.email,
          quantity: item.quantity,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      }

      return {
        _id: item._id,
        productId: product._id.toString(),
        email: item.email,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        
        // Product fields merged directly on the root of the cart item object
        title: product.title,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice,
        category: product.category,
        imageUrl: product.imageUrl,
        sellCount: product.sellCount
      };
    });

    res.json(flattenedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Update cart quantity by Cart document ID
export const updateCartQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const result = await Cart.findByIdAndUpdate(
      id,
      { $set: { quantity: quantity } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Delete single product from cart
export const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Cart.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Clear all cart items
export const clearAllCartItems = async (req, res) => {
  try {
    const { email } = req.query;
    let query = {};
    
    if (email) {
      query = { email: email.toLowerCase() };
    }

    const result = await Cart.deleteMany(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Move All to Cart (Saves only raw relationship fields)
export const moveToCart = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required to move items to cart" });
    }

    const normalizedEmail = email.toLowerCase();

    // 1. Fetch user's wishlist
    const wishlist = await Wishlist.findOne({ email: normalizedEmail });
    if (!wishlist || !wishlist.productIds || wishlist.productIds.length === 0) {
      return res.status(400).json({ message: "No products in your wishlist to move" });
    }

    // 2. Fetch existing product IDs in the user's cart
    const existingCartItems = await Cart.find({ email: normalizedEmail });
    const existingProductIds = existingCartItems.map(item => item.productId.toString());

    // 3. Filter out items that are already in their cart
    const productsToInsert = wishlist.productIds
      .map(id => id.toString())
      .filter(id => !existingProductIds.includes(id));

    if (productsToInsert.length === 0) {
      wishlist.productIds = [];
      await wishlist.save();
      return res.status(400).json({ message: "All products are already in the cart." });
    }

    // 4. Construct clean payloads containing only productId and email
    const cartPayloads = productsToInsert.map(productId => ({
      productId,
      email: normalizedEmail,
      quantity: 1 // Default quantity
    }));

    // 5. Insert clean documents into database
    const result = await Cart.insertMany(cartPayloads);

    // 6. Clear user's wishlist array cleanly
    wishlist.productIds = [];
    await wishlist.save();

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};