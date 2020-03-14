const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;

 module.exports = function(app, db) {
    const collection = db.collection('address-cover');

    /**
      * The functions performs common api-request actions:
      * - check token
      * - pass callback on success
      * - send error on failure
      */
    const checkRequestToken = (req, res, cb) => {
        const token = req.headers['x-access-token'];

        jwt.verify(token, SECRET, (err, decoded) => {
            if (decoded) {
                cb(decoded);
            } else {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(500).send('Something went wrong');
                }
            }
        });
    }

    app.post('/address-cover', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const record = {
                street: req.body.street,
                buildings: req.body.buildings,
                clinic_id: ObjectID(decoded.id)
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

    app.get('/address-cover', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const query = {
                clinic_id: ObjectID(decoded.id)
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