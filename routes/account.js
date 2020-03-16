const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;
const { ObjectID } = require('mongodb');


module.exports = function(app, db) {
    const clinicsCollection = db.collection('clinics');
    const doctorsCollection = db.collection('doctors');

    function checkAccountPassword(res, account, enteredPassword) {
        const result = bcrypt.compareSync(enteredPassword, account.password);
        if (result === true) {
            const accountType = account.hasOwnProperty('clinic_id') ? 'doctor' : 'clinic';
            const token = jwt.sign({ id: account._id, accountType}, SECRET, {
                expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).send({token, accountType});

        } else {
            res.status(401).send('Invalid username or password');
        }
    }

    app.post('/auth/login', (req, res) => {
        const accountDetails = {
            email: req.body.email
        };

        if (!req.body.email || !req.body.password) {
            res.status(406).send('Email and password must be provided');
            return;
        }

        clinicsCollection.findOne(accountDetails, (err, account) => {
            if (err) {
                res.send(err);
            } else {
                if (account && account.password) {
                    checkAccountPassword(res, account, req.body.password);
                } else {
                    db.collection('doctors').findOne(accountDetails, (err, account) => {
                        if (account && account.password) {
                            checkAccountPassword(res, account, req.body.password);
                        } else {
                            res.status(401).send('Invalid username or password');
                        }
                    });
                }
            }
        });
    });

    app.post('/auth/account', (req, res) => {
        const token = req.headers['x-access-token'];

        const loadDoctorAccount = (id) => {
            const details = {"_id": ObjectID(id)};

            doctorsCollection.findOne(details, (err, account) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    const categoryId = account.category_id;
                    db.collection('doctor-categories').findOne({"_id": categoryId}, (err, category) => {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            res.status(200).send({...account, categoryName: category.categoryName});
                        }
                    });
                }
            });
        };

        const loadClinicAccount = (id) => {
            const details = {"_id": ObjectID(id)};

            clinicsCollection.findOne(details, (err, item) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(item);
                }
            });
        };

        jwt.verify(token, SECRET, function(err, decoded) {
            if (decoded) {
                const id = decoded.id;
                const accountType = decoded.accountType;

                if (accountType === 'doctor') {
                    loadDoctorAccount(id);
                } else {
                    loadClinicAccount(id);
                }
               
            } else {
                if (err) {
                     res.status(500).send(err);
                 } else {
                    res.status(500).send('Something went wrong');
                 }
            }
            
        });
    });

    app.post('/auth/check-invitation-token', (req, res) => {
        const token = req.body.token;

        jwt.verify(token, SECRET, (err, decoded) => {
            if (decoded) {
                const accountId = decoded.id;
                const query = {"_id": ObjectID(accountId)};

                doctorsCollection.findOne(query, (err, item) => {
                    if (item.status === 'invited') {
                        res.status(200).send({isValid: true});
                    } else {
                        res.status(406).send('The link is invalid');
                    }
                });
            } else {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(500).send('Something went wrong');
                }
            }
        });
    });

    app.put('/auth/accept-invitation', (req, res) => {
        const token = req.body.token;
        const password = req.body.password;
        const salt = bcrypt.genSaltSync(10);

        jwt.verify(token, SECRET, (err, decoded) => {
            if (decoded) {
                const accountId = decoded.id;
                const query = {"_id": ObjectID(accountId)};
                const newValues = {$set: {
                    password: bcrypt.hashSync(req.body.password, salt),
                    status: "Active"
                }};

                db.collection('doctors').updateOne(query, newValues, (err, resp) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({updated: true});
                    }
                });
            } else {
                if (err) {
                     res.status(500).send(err);
                 } else {
                    res.status(500).send('Something went wrong');
                 }
            }
        });
    });
}