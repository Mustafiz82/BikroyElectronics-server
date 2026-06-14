import Product from '../models/Product.js';

// Helper function to build query object from request parameters
const buildProductQuery = (queryParams) => {
  const { categories, minPrice, maxPrice, searchText } = queryParams;
  const query = {};

  if (categories) {
    query.category = { $in: categories.split(",") };
  }

  // Handle price range filters
  if (minPrice && maxPrice) {
    query.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
  } else if (minPrice) {
    query.price = { $gte: parseInt(minPrice) };
  } else if (maxPrice) {
    query.price = { $lte: parseInt(maxPrice) };
  }

  // Handle dynamic text search matching title, description, category, or direct price matches
  if (searchText) {
    const searchRegex = new RegExp(searchText, "i");
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { price: parseInt(searchText) || 0 }
    ];
  }

  return query;
};

// 1. Get all products with filters, sorting, and text relevance sorting
export const getProducts = async (req, res) => {
  try {
    const { limit, sortBy, sortOrder, searchText, page } = req.query;
    const query = buildProductQuery(req.query);

    let sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const limitInt = parseInt(limit) || 3000;
    const pageInt = parseInt(page) || 0;

    // Execute query using .lean() for fast read performance
    let cursor = Product.find(query);
    if (sortBy) {
      cursor = cursor.sort(sortOptions);
    }
    
    let result = await cursor.skip(pageInt * limitInt).limit(limitInt).lean();

    // In-memory text matching relevance score (from original code)
    if (searchText) {
      const text = searchText.toLowerCase();

      const getScore = (p) => {
        let score = 0;
        const title = p.title?.toLowerCase() || "";
        const category = p.category?.toLowerCase() || "";
        const description = p.description?.toLowerCase() || "";

        if (category.includes(text)) score += 100;
        if (title.includes(text)) score += 50;
        if (description.includes(text)) score += 10;
        return score;
      };

      result = result
        .map(item => ({ ...item, _score: getScore(item) }))
        .sort((a, b) => b._score - a._score);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Count total products matching the current search/filter parameters (for pagination)
export const getProductCount = async (req, res) => {
  try {
    const query = buildProductQuery(req.query);
    const count = await Product.countDocuments(query);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get single product details by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Create a new product (Admin feature)
export const createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const result = await newProduct.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Update product details (Admin feature)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body.data || req.body;

    const result = await Product.updateOne(
      { _id: id },
      { $set: updateData }
    );

    res.json({
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Utility: Fix string prices to proper Numbers in bulk
export const fixPrices = async (req, res) => {
  try {
    const products = await Product.find({});
    
    const bulkOps = products.map(product => ({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            price: Number(product.price),
            discountedPrice: product.discountedPrice ? Number(product.discountedPrice) : null
          }
        }
      }
    }));

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    res.json({ success: true, message: "All prices successfully updated to number types in the database" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Utility: Set a baseline random sell count for placeholder products
export const fixSellCount = async (req, res) => {
  try {
    const result = await Product.updateMany(
      { sellCount: { $in: [0, "0", null] } },
      [
        {
          $set: {
            sellCount: {
              $add: [10, { $floor: { $multiply: [{ $rand: {} }, 81] } }]
            }
          }
        }
      ]
    );

    res.json({
      message: "sellCount updated successfully",
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// 8. Delete product by ID (Admin feature)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Product.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      deletedProduct: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};