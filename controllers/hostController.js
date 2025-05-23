const Home = require("../models/home");
const fs = require("fs");

exports.getHostHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-homes",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to airbnb",
    currentPage: "addHome",
    editing: false,
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
  });
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, rating, description } = req.body;

  if (!req.files || !req.files.photo) {
    console.log("No image provided");
    return res.status(422).send("No image Provided");
  }
  if (!req.files || !req.files.houseRules) {
    console.log("No House Rules provided");
    return res.status(422).redirect("/host/add-home");
  }

  console.log(req.files);
  const photo = req.files.photo[0].path;
  const houseRules = req.files.houseRules[0].path;
  const home = new Home({
    houseName,
    price,
    location,
    rating,
    photo,
    houseRules,
    description,
  });

  home.save().then(() => {
    console.log("Home Saved successfully");
  });

  res.redirect("/host/host-home-list");
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === "true";

  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("Home not found for editing.");
      return res.redirect("/host/host-home-list");
    }

    console.log(homeId, editing, home);
    res.render("host/edit-home", {
      home: home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      editing: editing,
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.postEditHome = (req, res, next) => {
  const { id, houseName, price, location, rating, description } = req.body;

  Home.findById(id)
    .then((home) => {
      home.houseName = houseName;
      home.price = price;
      home.location = location;
      home.rating = rating;
      home.description = description;

      if (req.files && req.files.photo) {
        fs.unlink(home.photo, (err) => {
          console.log("Error While deleting old photo");
        });
        home.photo = req.files.photo[0].path;
      }

      // Check and update house rules if provided
      if (req.files && req.files.houseRules) {
        fs.unlink(home.houseRules, (err) => {
          console.log("Error While deleting old house rules");
        });
        home.houseRules = req.files.houseRules[0].path;
      }
      return home.save();
    })
    .then((result) => {
      console.log("Successfully Updated");
      res.redirect("/host/host-home-list");
    })
    .catch((err) => {
      console.log("Error updating home:", err);
      res.redirect("/host/host-home-list");
    });
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;
  console.log("Came to delete ", homeId);
  Home.findByIdAndDelete(homeId)
    .then(() => {
      res.redirect("/host/host-home-list");
    })
    .catch((error) => {
      console.log("Error while deleting ", error);
    });
};
