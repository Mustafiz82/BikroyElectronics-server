import User from '../models/User.js'

// Get single user details by email
export const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Create user (Signup)
export const createUser = async (req, res) => {
  try {
    const userData = req.body;
    const existingUser = await User.findOne({ email: userData?.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User(userData);
    const result = await newUser.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user details from My Account page
export const updateUser = async (req, res) => {
  try {
    const updateUserObj = req.body;
    const email = updateUserObj.email;

    const result = await User.updateOne(
      { email: email },
      { $set: updateUserObj }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View users (Optionally filtered by 'customer: true')
export const getAllUsers = async (req, res) => {
  try {
    const { customer } = req.query;
    let query = {};
    
    if (customer === "true") {
      query = { customer: true };
    }

    const users = await User.find(query);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Make a user an Admin
export const makeAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await User.updateOne(
      { email: email },
      { $set: { role: 'admin' } }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

