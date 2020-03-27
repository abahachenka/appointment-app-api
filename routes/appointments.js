const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {checkRequestToken} = require('../helpers/account');
const SECRET = process.env.SECRET_KEY;

module.exports = function(app, db) {
    app.post('/appointments', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const doctorId = decoded.id;
            const appointment = {
                datetime: new Date(req.body.date + ' ' + req.body.time),
                doctor_id: ObjectID(doctorId)
            };

            db.collection('appointments')
                .insert(appointment, (err, resp) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({added: true});
                    }
                });
        });
    });

    app.get('/appointments', (req, res) => {
        const getDistrictDoctorAppointments = (query) => {

            db.collection('doctor-address-cover')
                .findOne(query, (err, result) => {
                    if (err) {
                        res.status(500).send(err);
                        return;
                    }

                    // get doctor data
                    db.collection('doctors')
                        .findOne({
                                _id: ObjectID(result.doctor_id)
                            },
                            {
                                projection: {
                                    '_id': 1,
                                    'title': 1,
                                    'firstName': 1,
                                    'lastName': 1,
                                    'room': 1
                                }
                            },
                            (err, doctor) => {
                                if (err) {
                                    res.status(500).send(err);
                                    return;
                                }

                                // get doctor available appointments
                                db.collection('appointments')
                                    .find({
                                        doctor_id: ObjectID(doctor._id),
                                        order_number: null,
                                        datetime: {
                                            $gte: new Date()
                                        }
                                    })
                                    .toArray((err, appointments) => {
                                        if (err) {
                                            res.status(500).send(err);
                                            return;
                                        }

                                        const newAppointments = [];

                                        appointments.forEach((appointment, index) => {
                                            newAppointments.push({...appointment, doctor})
                                        });

                                        res.status(200).send(newAppointments);
                                    });
                            });
                });
        };

        const getCategoryAllDoctorAppointments = (query) => {
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

                    db.collection('appointments')
                        .find({
                            doctor_id: {
                                $in: doctorIds,
                            },
                            order_number: null,
                            datetime: {
                                $gte: new Date()
                            }
                        })
                        .toArray((err, appointments) => {
                            if (err) {
                                res.status(500).send(err);
                            } else {
                                const newAppointments = [];

                                appointments.forEach((appointment, index) => {
                                    doctors.forEach((doctor, index) => {
                                        if (appointment.doctor_id.equals(doctor._id)) {
                                            newAppointments.push({...appointment, doctor})
                                        }
                                    });
                                });
                                res.status(200).send(newAppointments);
                            }
                        });
                });
        }

        let query;

        if (req.query.filter) {
            let address = req.query.filter.split(',');

            query = {
                place: address[0].trim(),
                street: address[1].trim(),
                buildings: address[2].trim()
            };

            getDistrictDoctorAppointments(query);
            return;
        }

        if (req.query.categoryId) {
            query = {
                category_id: ObjectID(req.query.categoryId),
                status: 'Active'
            };

            getCategoryAllDoctorAppointments(query);
        } else {
            checkRequestToken(req, res, (decoded) => {
                query = {
                    doctor_id: ObjectID(decoded.id)
                };

                db.collection('appointments')
                    .find(query)
                    .toArray((err, items) => {
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
        const orderNumber = String(Math.floor(Date.now() / 60000));
        const patient = {
            patient_firstname: req.body.firstName,
            patient_lastname: req.body.lastName,
            patient_contact_number: req.body.contactNumber,
            order_number: orderNumber
        };

        db.collection('appointments')
            .updateOne(details, {$set: {...patient}}, (err, result) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send({orderNumber});
                }
            });
    });

    app.post('/appointments/cancel', (req, res) => {
        const orderNumber = req.body.orderNumber;
        const details = {order_number: orderNumber};

        db.collection('appointments')
            .update(details, {$set: {
                patient_firstname: null,
                patient_lastname: null,
                patient_contact_number: null,
                order_number: null
            }})
            .then(resp => {
                if (resp.result.nModified === 0) {
                    res.status(500).send('Wrong order number');
                } else {
                    res.status(200).send({cancelled: true});
                }
            })
            .catch(err => {
                res.status(500).send(err);
            });
    });
};