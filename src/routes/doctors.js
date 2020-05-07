const { ObjectID } = require('mongodb');
const nodeMailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const {
    checkRequestToken, 
    checkEmail,
    validateEmail
} = require('../helpers/account');
const SECRET = process.env.SECRET_KEY;

module.exports = function(app, db) {
    app.post('/doctor-categories', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            if (req.body.categoryName) {
                const id = decoded.id;
                const alias = req.body.categoryName.trim().toLowerCase().replace(/\s/gi, '-');
                const category = {
                    categoryName: req.body.categoryName,
                    categoryAlias: alias,
                    clinic_id: ObjectID(id)
                };

                db.collection('doctor-categories')
                    .find({
                        categoryAlias: alias,
                        clinic_id: ObjectID(id)
                    })
                    .toArray((err, items) => {
                        if (err) {
                            res.status(500).send(err);
                        } else if (items && items.length){
                            res.status(406).send('This category already exists');
                        } else {
                            db.collection('doctor-categories')
                                .insert(category, (err, result) => {
                                    if (err) {
                                        res.status(500).send(err);
                                    } else {
                                        res.status(200).send(result.ops[0]);
                                    }
                                });
                        }
                    });
            } else {
                res.status(406).send('Category name is not provided');
            }
        });
    });

    app.get('/doctor-categories', (req, res) => {
        // The request is called from the user side
        const getAppointmentDoctorCategories = (clinicId) => {
            db.collection('doctor-categories')
                .find({
                    clinic_id: ObjectID(clinicId)
                })
                .toArray((err, items) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(items);
                    }
                });
        }

        if (req.query.clinicId) {
            getAppointmentDoctorCategories(req.query.clinicId);
        } else {
            checkRequestToken(req, res, (decoded) => {
                db.collection('doctor-categories')
                    .find({
                        clinic_id: ObjectID(decoded.id)
                    })
                    .toArray((err, categories) => {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            if (categories && categories.length) {
                                const categoryIds = [];

                                categories.forEach((category, index) => {
                                    categoryIds.push(category._id);
                                });

                                db.collection('doctors')
                                    .find({
                                        category_id: {
                                            $in: categoryIds
                                        }
                                    })
                                    .toArray((err, doctors) => {
                                        if (err) {
                                            res.status(500).send(err);
                                        } else {
                                            categories.forEach((category) => {
                                                if (!category.doctors) {
                                                    category.doctors = {
                                                        active: 0,
                                                        invited: 0
                                                    };
                                                }
                                                doctors.forEach((doctor) => {
                                                    if (doctor.category_id.equals(category._id)) {
                                                        if (doctor.status.toLowerCase() === 'invited') {
                                                            category.doctors.invited ++;
                                                        } else if (doctor.status.toLowerCase() === 'active'){
                                                            category.doctors.active ++;
                                                        }
                                                    }
                                                })
                                            });

                                            res.status(200).send(categories);
                                        }
                                    });
                            } else {
                                res.status(200).send([]);
                            }
                        }
                    });
            });
        }
    });

    app.get('/doctor-categories/:categoryAlias', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const clinicId = decoded.id;
            const categoryAlias = req.params.categoryAlias;
            const query = {
                clinic_id: ObjectID(clinicId),
                categoryAlias: categoryAlias
            };


            db.collection('doctor-categories')
                .findOne(query, (err, item) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(item);
                    }
                });
        });
    });

    app.get('/doctor-categories/:categoryId/doctors', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const clinicId = decoded.id;
            const categoryId = req.params.categoryId;
            const query = {
                clinic_id: ObjectID(clinicId), 
                category_id: ObjectID(categoryId)
            };

            db.collection('doctors')
                .find(query)
                .sort({status: 1})
                .toArray((err, items) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(items);
                    }
                });
        });
    });

    function sendInvitation(toEmail, link) {
        let transporter = nodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            }
        });

        let mailOptions = {
            to: toEmail,
            subject: 'Doctor Account Invitation',
            html: `
                    <p>You have been invited to create a doctor account<br>
                        <a href="${link}">${link}</a>
                    </p>
                `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    }

    app.post('/doctor-categories/:categoryId/doctors/invite', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            if (!req.body.title) {
                res.status(406).send('Title must be specified');
                return;
            }

            if (!req.body.firstName) {
                res.status(406).send('First name must be specified');
                return;
            }

            if (!req.body.lastName) {
                res.status(406).send('Last name must be specified');
                return;
            }

            if (!req.body.room) {
                res.status(406).send('Room must be specified');
                return;
            }

            if (!req.body.email) {
                res.status(406).send('Email must be specified');
                return;
            } else if (validateEmail(req.body.email) === false) {
                res.status(406).send('Email is not valid');
                return;
            } else {
                checkEmail(db, req.body.email, (err, isEmailUnique) => {
                    if (isEmailUnique) {
                        const clinicId = decoded.id;
                        const categoryId = req.params.categoryId;
                        const doctor = {
                            title: req.body.title,
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
                            room: req.body.room,
                            email: req.body.email,
                            clinic_id: ObjectID(clinicId),
                            category_id : ObjectID(categoryId),
                            status: 'invited'
                        };

                        db.collection('doctors')
                            .insert(doctor, (err, resp) => {
                                if (err) {
                                    res.status(500).send(err);
                                } else {
                                    const record = resp.ops[0];
                                    const token = jwt.sign({ id: record._id }, SECRET, {
                                        expiresIn: 669600 // expires in 7 days
                                    });
                                    const acceptInvitationLink = process.env.UI_SERVER_URL + '/accept-invitation/' + token;
                                    sendInvitation(req.body.email, acceptInvitationLink);

                                    res.status(200).send({sent: true});
                                }
                            });
                    } else {
                        res.status(500).send(err);
                    }
                });
            }
        });
    });
}