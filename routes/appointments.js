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
            const appointment = {
                datetime: new Date(req.body.date + ' ' + req.body.time),
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
        let query;

        if (req.query.categoryId) {
            query = {
                category_id: ObjectID(req.query.categoryId),
                status: 'Active'
            };
            db.collection('doctors')
                .find(query)
                .project({
                    '_id': 1,
                    'title': 1,
                    'firstName': 1,
                    'lastName': 1,
                    'room': 1
                })
                .toArray((err, doctors) => {
                    const doctorIds = doctors.map((doctor) => {
                        return doctor._id;
                    });

                    collection.find({
                        doctor_id: {
                            $in: doctorIds,
                        },
                        patient_firstname: null,
                        patient_lastname: null,
                        datetime: {
                            $gte: new Date()
                        }
                    }).toArray((err, appointments) => {
                        const newAppointments = [];

                        appointments.forEach((appointment, index) => {
                            doctors.forEach((doctor, index) => {
                                if (appointment.doctor_id.equals(doctor._id)) {
                                    newAppointments.push({...appointment, doctor})
                                }
                            });
                        });
                        res.send(newAppointments);
                    });
                });
        } else {
            checkRequestToken(req, res, (decoded) => {
                query = {
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
        }
    });

    app.put('/appointments/:id', (req, res) => {
        const id = req.params.id;
        const details = {_id: ObjectID(id)};
        const orderNumber = Math.floor(Date.now() / 60000);
        const patient = {
            patient_firstname: req.body.firstName,
            patient_lastname: req.body.lastName,
            patient_contact_number: req.body.contactNumber,
            order_number: orderNumber
        };

        collection.updateOne(details, {$set: {...patient}}, (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send({orderNumber});
            }
        });
    });
};