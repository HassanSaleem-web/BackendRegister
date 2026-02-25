const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =========================
//   REGISTER USER
// =========================
const registerUser = async (req, res) => {
  const { name, company, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      company,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
      },
      token,
    });

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// =========================
//   LOGIN USER
// =========================
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required." });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Create JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company
      },
      token,
    });

  } catch (error) {
    console.error("🔥 Login error details:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ message: "Server error: " + error.message });
  }
};

// =========================
//   GET LOGGED-IN USER
// =========================
const getLoggedInUser = async (req, res) => {
  try {
    // req.user is filled by your JWT middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (err) {
    console.error("getLoggedInUser error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = { registerUser, loginUser, getLoggedInUser };
