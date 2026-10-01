const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing Bearer token" });
    }

    const payload = jwt.verify(token, "nenuborad@112"); 
    req.auth = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid/Expired token" });
  }
}

function optionalAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (token) {
      const payload = jwt.verify(token, "nenuborad@112");
      req.auth = payload;
    }
  } catch (err) {
    // optional token failure ignored
  }
  next();
}

module.exports = { requireAuth, optionalAuth };