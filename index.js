const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const AWS = require("aws-sdk");
const multer = require("multer");

const app = express();

// Enter copied or downloaded access ID and secret key here
const accessKeyId = "YOUR_ACCESS_KEY_ID";
const secretAccessKey = "YOUR_SECRET_ACCESS_KEY";

// The name of the bucket that you have created
const BUCKET_NAME = "YOUR_BUCKET_NAME";

// Initialize S3 bucket
const s3 = new AWS.S3({
  accessKeyId,
  secretAccessKey
});

// set the multer memory storage
const storage = multer.memoryStorage();

// setting the memory storage as the multer storage
// in here we don't save the file to disk
// we save it in the memory and then we use the memory buffer
// which will be uploaded to AWS S3 bucket
const upload = multer({
  storage
});

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

// render upload file web page
app.get("/upload", (req, res) => {
  res.render("upload", {
    imageURL: null
  });
});

// upload file
app.post("/upload", upload.single("image"), (req, res) => {
  const file = req.file;

  // Setting up S3 upload parameters
  const params = {
    Bucket: BUCKET_NAME,
    ContentType: file.mimetype, // file mimetype image/jpg image/png etc.
    Key: `${file.originalname}.${new Date().getTime()}`, // File name and current time
    Body: file.buffer, // file blob (This is what we upload
    ACL: "public-read", // this is used to tell that the imageURL is public
    ContentLength: file.size
  };

  // Uploading files to the bucket
  s3.upload(params, function(err, data) {
    if (err) {
      res.render("upload", { imageURL: null });
    }
    res.render("upload", { imageURL: data.Location });
  });
});

const port = 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
