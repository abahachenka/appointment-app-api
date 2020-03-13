const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;

module.exports = function(app, db) {
    const categoriesCollection = db.collection('doctor-categories');
    const doctorsCollection = db.collection('doctors');

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

                categoriesCollection.insert(category, (err, result) => {
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
        checkRequestToken(req, res, (decoded) => {
            const id = decoded.id;

            categoriesCollection.find({clinic_id: ObjectID(id)}).toArray((err, items) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(items);
                }
            });
        });
    });

    app.get('/doctor-categories/:categoryAlias', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const clinicId = decoded.id;
            const categoryAlias = req.params.categoryAlias;
            const query = {
                clinic_id: ObjectID(clinicId),
                categoryName: categoryAlias
            };

            categoriesCollection.findOne(query, (err, item) => {
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

            doctorsCollection.find(query).toArray((err, items) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(items);
                }
            });
        });
    });

    app.post('/doctor-categories/:categoryId/doctors/invite', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
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

            // todo: send email

            doctorsCollection.insert(doctor, (err, record) => {
                const token = jwt.sign({ id: record._id }, SECRET, {
                    expiresIn: 172800 // expires in 48 hours
                });
                const acceptInvitationLink = process.env.UI_SERVER_URL + ':' + process.env.UI_SERVER_PORT + '/accept-invitation/' + token;

                if (err) {
                    res.status(500).send(err);
                } else {
                    // return email link
                    res.status(200).send(acceptInvitationLink);
                }
            });
        });
    });
}