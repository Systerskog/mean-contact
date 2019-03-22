// Defining variables and importing required librarys
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = "contacts";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// db variable in the global scope so that the connection can be used by all the route handlers.
var db;

// Connecting to the database before starting the application server to avoid crashes 
// The MongoDB connection string from MLab that holds the credentials to access the database is stored in a config enviroment variable - MONGODB_URI.
mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/test", function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

/* 
   CONTACTS API ROUTES 
*/

// Error handler that all the endpoints make use of.
function errorHandler(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

//    Route: "/contacts"
//    GET: finds all contacts
app.get("/contacts", function(req, res) {
  db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      errorHandler(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);  // successful HTTP requests, the response will contain an entity corresponding the contacts
    }
  });
});

//    Route: "/contacts"
//    POST: creates a new contact
app.post("/contacts", function(req, res) {
  var createContact = req.body;
  createContact.createDate = new Date();

  if (!(req.body.firstName || req.body.lastName)) {
    errorHandler(res, "Wops! Invalid user input", "Please provide a first- or last name.", 400);
  }

  db.collection(CONTACTS_COLLECTION).insertOne(createContact, function(err, doc) {
    if (err) {
      errorHandler(res, err.message, "Something went wrong... Failed to create new contact. Try again!");
    } else {
      res.status(201).json(doc.ops[0]); // The request has been fulfilled, resulting in the creation of a contact.
    }
  });
});

//  Route: "/contacts/:id"
//  GET: find contact by id
app.get("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      errorHandler(res, err.message, "Could not get the contact.");
    } else {
      res.status(200).json(doc);  // successful HTTP requests, the response will contain an entity corresponding to the requested contact
    }
  });
});

//    Route: "/contacts/:id"
//    PUT: update contact by id
app.put("/contacts/:id", function(req, res) {
  var updateContact = req.body;
  delete updateContact._id;

  db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateContact, function(err, doc) {
    if (err) {
      errorHandler(res, err.message, "Something went wrong when updating the contact, try agian.");
    } else {
      res.status(204).end(); // The server successfully processed the request
    }
  });
});

//    Route: "/contacts/:id"
//    DELETE: deletes contact by id
app.delete("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      errorHandler(res, err.message, "Oh no, failed to delete the contact.");
    } else {
      res.status(204).end(); // The server successfully processed the request
    }
  });
});