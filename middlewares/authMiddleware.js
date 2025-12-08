const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  console.log("---- AUTH DEBUG ----");

  console.log("Authorization header received:", req.headers.authorization);

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No valid Bearer token found.");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  console.log("Extracted token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };

    console.log("req.user set:", req.user);
    console.log("--------------------");
    next();
  } catch (err) {
    console.log("JWT VERIFY ERROR:", err);
    return res.status(401).json({ message: "Token invalid or malformed" });
  }
};
