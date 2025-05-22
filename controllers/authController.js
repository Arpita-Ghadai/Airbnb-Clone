const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "login",
    isLoggedIn: false,
    errors: [],
    oldInput: {},
    user: {},
  });
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(422).render("auth/login", {
      pageTitle: "Login",
      currentPage: "login",
      isLoggedIn: false,
      errors: ["No such Email found, Enter the correct email"],
      oldInput: {
        email,
      },
      user: {},
    });
  } else {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      req.session.isLoggedIn = true;
      req.session.user = user;
      await req.session.save();
      res.redirect("/");
    } else {
      res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: false,
        errors: ["Password Is Wrong"],
        oldInput: {
          email,
          password,
        },
        user: {},
      });
    }
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

exports.getSignUp = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "SignUp",
    currentPage: "signup",
    isLoggedIn: false,
    errors: [],
    oldInput: {},
    user: {}, // Ensure oldInput exists
  });
};

exports.postSignup = [
  check("firstName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First Name should be atleast 2 characters long")
    .matches(/^[A-Za-z]+$/)
    .withMessage("First Name should be alphabets only"),
  check("lastName")
    .matches(/^[A-Za-z]*$/)
    .withMessage("Last Name should be alphabets only"),

  check("email")
    .isEmail()
    .withMessage("Please enter a valid mail")
    .normalizeEmail(),

  check("password")
    .isLength({ min: 8 })
    .withMessage("Password should be atleast 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password should contain atleast one UpperCase")
    .matches(/[a-z]/)
    .withMessage("Password should conatin atleast one LowerCase")
    .matches(/[0-9]/)
    .withMessage("Password should be atleast one number")
    .matches(/[<>,.?|{}!@#$%^&*()]/)
    .withMessage("Passworld must contain atleast one special symbol")
    .trim(),
  check("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password do not match");
      }
      return true;
    }),

  check("userType")
    .notEmpty()
    .withMessage("User Type is required")
    .isIn(["guest", "host"])
    .withMessage("Invalid User Type"),

  check("terms")
    .notEmpty()
    .withMessage("Please accept the terms and conditions")
    .custom((value, { req }) => {
      if (value !== "on") {
        throw new Error("Please accept the Terms and  Conditions");
      }
      return true;
    }),

  (req, res, next) => {
    const { firstName, lastName, email, password, userType } = req.body;
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render("auth/signup", {
        pageTitle: "SignUp",
        currentPage: "signup",
        isLoggedIn: false,
        errors: errors.array().map((error) => error.msg),
        oldInput: {
          firstName,
          lastName,
          email,
          password,
          userType,
        },
        user: {},
      });
    }
    bcrypt
      .hash(password, 12)
      .then((hashPassword) => {
        const user = new User({
          firstName,
          lastName,
          email,
          password: hashPassword,
          userType,
        });
        return user.save();
      })
      .then(() => {
        console.log("Successfully Saved User");
        res.redirect("/login");
      })
      .catch((err) => {
        console.log("Error while saving in database");
        return res.status(422).render("auth/signup", {
          pageTitle: "SignUp",
          currentPage: "signup",
          isLoggedIn: false,
          errors: [err.message],
          oldInput: {
            firstName,
            lastName,
            email,
            password,
            userType,
            user: {},
          },
        });
      });
  },
];
