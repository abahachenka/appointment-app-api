const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;

 module.exports = function(app, db) {
    const collection = db.collection('appointments');

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

    app.post('/appointments', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const doctorId = decoded.id;
            console.log(req.body);
            const appointment = {
                date: req.body.date,
                time: req.body.time,
                doctor_id: ObjectID(doctorId)
            };

            collection.insert(appointment, (err, resp) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send({added: true});
                }
            });
        });
    });

    app.get('/appointments', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const query = {
                doctor_id: ObjectID(decoded.id)
            };

            collection.find(query).toArray((err, items) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(items);
                }
            });
        });
    });
};