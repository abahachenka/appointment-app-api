const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const cors = require('cors');

// retrieving environmental variables
require('dotenv').config();
const port = process.env.PORT || 3000;
const dbURL = process.env.DB_URL || '';

// initializing db client
const dbClient = new MongoClient(dbURL);

// initializing express instance
const app = express();
app.use(express.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cors());

try {
    MongoClient.connect(dbURL, { useUnifiedTopology: true }, (err, client) => {
        const database = client.db('appointment-app');

        // importing routes
        require('./routes')(app, database);

        app.listen(port, () => {
            console.log('We are live on ' + port);
        });
    });
} catch (err) {
    console.log(err);
} finally {
    dbClient.close();
}



