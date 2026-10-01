const express = require("express");
const passport = require("passport");
const router = express.Router();

const AuthController = require("../controller/auth.controller");

// test
router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Auth route working",
  });
});

// register
router.post("/register", AuthController.register);

// login
router.post(
  "/login",
  (req, res, next) => {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || "Invalid credentials",
        });
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  AuthController.login
);

// forgot password
router.post("/forgot-password", AuthController.forgotPassword);

// reset password
router.post("/reset-password", AuthController.resetPassword);

module.exports = router;