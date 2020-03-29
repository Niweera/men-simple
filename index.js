const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set the view engine to ejs
app.set("view engine", "ejs");

// Add database connection
mongoose
  .connect(`mongodb://localhost:27017/sample-db`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log("> Successfully connected to the database");
  })
  .catch(err => {
    console.log(err.message);
  });

// Start a mongoose connection
const db = mongoose.connection;

// Add a on error event listener
// This will fire every time there is an error occurs
db.on("error", () => {
  console.log("> error occurred from the database");
});

// Add a once open event listener
// This will fire only once when the connection is established and connected to the db
db.once("open", () => {
  console.log("> successfully accessed the database");
});

// Add a reference to mongoose Schema object
const Schema = mongoose.Schema;

const nameSchema = new Schema(
  {
    name: { type: mongoose.SchemaTypes.String }
  },
  { strict: true, timestamps: true }
);

// create the main modal
const NameModel = mongoose.model("names", nameSchema, "names");

// use res.render to load up an ejs view file
// index page
app.get("/", (req, res) => {
  NameModel.find({})
    .then(data => {
      res.render("home", { data });
    })
    .catch(() => {
      res.render("home", { data: [] });
    });
});

// add a new name to the list
app.post("/add-name", (req, res) => {
  new NameModel({
    name: req.body.name_field
  })
    .save()
    .then(() => {
      res.redirect("/");
    })
    .catch(() => {
      res.redirect("/");
    });
});

const port = 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
