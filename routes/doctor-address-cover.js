const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;
const {checkRequestToken} = require('../helpers/account');

 module.exports = function(app, db) {
    const collection = db.collection('doctor-address-cover');

    app.post('/doctor-address-cover', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            let buildings = req.body.buildings.split(',');
            buildings = buildings.map((building, index) => {
                return building.trim().toLowerCase();
            });

            const record = {
                place: req.body.place,
                street: req.body.street,
                buildings,
                doctor_id: ObjectID(decoded.id)
            };

            collection.insertOne(record, (err, result) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send({added: true});
                }
            });
        });
    });

    app.get('/doctor-address-cover', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const query = {
                doctor_id: ObjectID(decoded.id)
            };

            collection.find(query).toArray((err, result) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(result);
                }
            });
        });
    });
};