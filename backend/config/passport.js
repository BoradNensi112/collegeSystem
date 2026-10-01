const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { Op } = require("sequelize");

module.exports = function initPassport(passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "user_name", passwordField: "password", session: false },
      async (user_name, password, done) => {
        try {
          const identifier = String(user_name || "").trim();
          const user = await User.findOne({
            where: {
              [Op.or]: [
                { user_name: identifier },
                { email: identifier.toLowerCase() }
              ]
            }
          });

          if (!user) return done(null, false, { message: "Invalid username or email" });

          let ok = false;
          if (user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$"))) {
            ok = await bcrypt.compare(password, user.password);
          } else {
            // fallback if legacy plaintext password
            ok = password === user.password;
          }

          if (!ok) return done(null, false, { message: "Invalid username/email or password" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};