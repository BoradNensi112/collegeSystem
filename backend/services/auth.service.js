const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { Op } = require("sequelize");


function signToken(user) {
  return jwt.sign(
    { sub: user.user_id.toString(), user_name: user.user_name, user_type: user.user_type },
    "nenuborad@112",
    { expiresIn: "1d" }
  );
}

async function register({
  first_name,
  last_name,
  user_name,
  email,
  password,
  user_type,
  course,
  sem,
  enrollment,
  mobile,
  father_name,
  father_mobile,
  dob
}) {

  if (!email || !password || !user_name)
    throw new Error("Required fields missing");

  const username = user_name.toLowerCase();
  const userEmail = email.toLowerCase();

  const existing = await User.findOne({
    where: {
      [Op.or]: [
        { email: email },
        { user_name: user_name }
      ]
    }
  });

  if (existing)
    throw new Error("Username or email already registered");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    first_name,
    last_name,
    user_name: username,
    email: userEmail,
    password: passwordHash,
    user_type,
    course,
    sem,
    enrollment,
    mobile,
    father_name,
    father_mobile,
    dob
  });

  const token = signToken(user);

  return {
    user: {
      name: user.user_name,
      email: user.email
    },
    token,
  };
}


async function login(userFromPassport) {
  const token = signToken(userFromPassport);
  return {
    user: { name: userFromPassport.user_name, email: userFromPassport.email },
    token,
  };
}

module.exports = { register, login };
