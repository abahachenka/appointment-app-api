const { ObjectID } = require('mongodb');
const nodeMailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const {checkRequestToken, checkEmail} = require('../helpers/account');
const SECRET = process.env.SECRET_KEY;

module.exports = function(app, db) {
    app.post('/doctor-categories', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            if (req.body.categoryName) {
                const id = decoded.id;
                const alias = req.body.categoryName.toLowerCase().replace(/\s/gi, '-');
                const category = {
                    categoryName: req.body.categoryName,
                    categoryAlias: alias,
                    clinic_id: ObjectID(id)
                };

                db.collection('doctor-categories')
                    .insert(category, (err, result) => {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            res.status(200).send(result.ops[0]);
                        }
                    });
            } else {
                res.status(406).send('Category name is not provided');
            }
        });
    });

    app.get('/doctor-categories', (req, res) => {
        const getDoctorCategories = (clinicId) => {
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
            getDoctorCategories(req.query.clinicId);
        } else {
            checkRequestToken(req, res, (decoded) => {
                getDoctorCategories(decoded.id);
            });
        }
    });

    app.get('/doctor-categories/:categoryAlias', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const clinicId = decoded.id;
            const categoryAlias = req.params.categoryAlias;
            const query = {
                clinic_id: ObjectID(clinicId),
                categoryName: categoryAlias
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
                // should be replaced with real sender's account
                user: 'info.appointment.by@gmail.com',
                pass: 'solid9557727l'
            }
        });

        let mailOptions = {
            // should be replaced with real recipient's account
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
            if (req.body.email) {
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
                                        expiresIn: 172800 // expires in 48 hours
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