import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';



export const addToWishlist = async (req, res) => {
  try {
    const { email, productId } = req.body;

    if (!email || !productId) {
      return res.status(400).json({ message: "Email and productId are required" });
    }

    const normalizedEmail = email.toLowerCase();

    let wishlist = await Wishlist.findOne({ email: normalizedEmail });

    if (!wishlist) {
      wishlist = new Wishlist({
        email: normalizedEmail,
        productIds: [productId]
      });
      const result = await wishlist.save();
      return res.status(201).json(result);
    }

    if (wishlist.productIds.includes(productId)) {
      return res.status(409).json({
        message: "Product already exists in the wishlist"
      });
    }

    wishlist.productIds.push(productId);
    const result = await wishlist.save();
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Find wishlist by email
export const getWishlistByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email query parameter is required" });
    }

    const wishlist = await Wishlist.findOne({ email: email.toLowerCase() });

    if (!wishlist || !wishlist.productIds || wishlist.productIds.length === 0) {
      return res.json([]);
    }

    const products = await Product.find({ _id: { $in: wishlist.productIds } });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check whether a specific product ID is inside the user's wishlist array
export const checkWishlistStatus = async (req, res) => {
  try {
    const { email, id } = req.query; // 'id' corresponds to the product ID

    if (!email || !id) {
      return res.status(400).json({ message: "Missing id or email parameter" });
    }

    const wishlist = await Wishlist.findOne({ email: email.toLowerCase() });

    if (wishlist && wishlist.productIds.includes(id)) {
      res.json({ wishListed: true });
    } else {
      res.json({ wishListed: false });
    }
  } catch (error) {
    res.status(500).json({ message: "Error checking wishlist status", error: error.message });
  }
};

//  Remove a product ID from the user's wishlist array
export const deleteFromWishlist = async (req, res) => {
  try {
    const { id } = req.params; // The Product ID to remove
    const { email } = req.query; // The User's email to identify the correct document

    if (!email) {
      return res.status(400).json({ message: "Email query parameter is required to remove items" });
    }

    const result = await Wishlist.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $pull: { productIds: id } },
      { new: true }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};