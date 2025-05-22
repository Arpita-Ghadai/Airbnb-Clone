const Home = require("../models/home");
const User = require("../models/user");
const rootDir = require("../utils/pathUtil");
const path = require("path");

exports.getIndex = (req, res, next) => {
  console.log("Session Value:", req.session);
  Home.find().then((registeredHomes) => {
    res.render("store/index", {
      registeredHomes: registeredHomes,
      pageTitle: "airbnb Home",
      currentPage: "index",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    res.render("store/home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Homes List",
      currentPage: "Home",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "bookings",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
  });
};

exports.getFavouriteList = async (req, res, next) => {
  const userId = req.session.user._id;
  const user = await User.findById(userId).populate("favourites");

  res.render("store/favourite-list", {
    favouriteHomes: user.favourites,
    pageTitle: "My Favourites",
    currentPage: "favourites",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
  });
};

exports.postAddToFavourite = async (req, res, next) => {
  const houseId = req.body.id;
  const userID = req.session.user._id;
  const user = await User.findById(userID);
  if (!user.favourites.includes(houseId)) {
    user.favourites.push(houseId);
    await user.save();
  }

  res.redirect("/favourites");
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  const homeId = req.params.homeId;

  if (user.favourites.includes(homeId)) {
    user.favourites = user.favourites.filter((fav) => fav != homeId);
    await user.save();
  }
  res.redirect("/favourites");
};

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("Home not found");
      res.redirect("/homes");
    } else {
      res.render("store/home-detail", {
        home: home,
        pageTitle: "Home Detail",
        currentPage: "Home",
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user,
      });
    }
  });
};

exports.getHomeRules = (req, res, next) => {
  const homeId = req.params.homeId;

  Home.findById(homeId)
    .then((home) => {
      if (!home) {
        return res.status(404).send("Home not found");
      }

      if (!home.houseRules) {
        return res.status(404).send("No house rules found for this home");
      }

      // Ensure houseRules is correctly formatted
      const fileName = home.houseRules;
      const filePath = path.join(rootDir, fileName); // Remove extra "uploads"

      console.log("Corrected File Path:", filePath);

      // Send file as a download
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          return res.status(500).send("Error downloading file");
        }
      });
    })
    .catch((err) => {
      console.error("Error fetching home:", err);
      res.status(500).send("Server error");
    });
};
