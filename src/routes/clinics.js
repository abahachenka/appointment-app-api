const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');
const {
    checkEmail, 
    validateEmail, 
    validatePassword
} = require('../helpers/account');

module.exports = function(app, db) {
    const clinicsCollection = db.collection('clinics');
    const addressCoverCollection = db.collection('clinic-address-cover');

    // Get all clinics
    app.get('/clinics', (req, res) => {
        if (req.query) {
            // get by address
            const query = {
                place: req.query.place,
                street: req.query.street,
                buildings:  req.query.building
            };

            const projection = {
                "clinic_id": 1,
                "_id": 0
            };

            addressCoverCollection
                .find(query)
                .project(projection)
                .toArray((err, items) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        let clinicIds = [];

                        items.map((item) => {
                            clinicIds.push(ObjectID(item.clinic_id));
                        });

                        const clinicsQuery = {
                            "_id": { $in: clinicIds }
                        };

                        clinicsCollection
                            .find(clinicsQuery)
                            .toArray((err, clinics) => {
                                if (err) {
                                    res.status(500).send(err);
                                } else {
                                    res.status(200).send(clinics);
                                }
                        });
                    }
            });
        } else {

            // get all
            clinicsCollection.find({}).toArray((err, items) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(items);
                }
            });
        } 
    });

    // Create a new clinic
    app.post('/clinics', (req, res) => {
        const salt = bcrypt.genSaltSync(10);

        if (!req.body.name) {
            res.status(406).send('Clinic name must be specified');
            return;
        }

        if (!req.body.email) {
            res.status(406).send('Account email must be specified');
            return;
        }

        if (validateEmail(req.body.email) === false) {
            res.status(406).send('Email is not valid');
            return;
        }

        if (!req.body.password) {
            res.status(406).send('Password must be specified');
            return;
        }

        const passValidationResult = validatePassword(req.body.password);

        if (!passValidationResult.isValid) {
            res.status(406).send(passValidationResult.error);
            return;
        }

        if (req.body.password !== req.body.confirmPassword) {
            res.status(406).send('Passwords do not match');
            return;
        }

        checkEmail(db, req.body.email, (err, isEmailUnique) => {
            if (isEmailUnique) {
                const alias = req.body.name.trim().toLowerCase().replace(/\s/gi, '-').replace(/[#№]/gi, '');

                const clinic = {
                    name: req.body.name,
                    alias,
                    phoneNumber: req.body.phoneNumber,
                    address: req.body.address,
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password, salt)
                };

                clinicsCollection.insert(clinic, (err, result) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(result.ops[0]);
                    }
                });
            } else {
                res.status(406).send(err);
            }
        });
    });

    // Get a single clinic
    app.get('/clinics/:id', (req, res) => {
        const id = req.params.id;
        const details = {"_id": ObjectID(id)};

        clinicsCollection.findOne(details, (err, item) => {
            if (err) {
                res.send(err);
            } else {
                res.send(item);
            }
        });
    });

    // Updating a clinic's info
    app.put('/clinics/:id', (req, res) => {
        const id = req.params.id;
        const details = {"_id": ObjectID(id)};
        const clinic = {
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            password: req.body.password
        };

        clinicsCollection.updateOne(details, { $set: {...clinic} }, (err) => {
            if (err) {
                res.send(err);
            } else {
                res.send('The record ' + id + ' has been updated');
            }
        });
    });
};