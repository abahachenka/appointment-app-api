const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;

module.exports = function(app, db) {
    const categoriesCollection = db.collection('doctor-categories');
    const doctorsCollection = db.collection('doctors');

    app.get('/doctor-categories', (req, res) => {
        const token = req.headers['x-access-token'];

        jwt.verify(token, SECRET, function(err, decoded) {
            if (decoded) {
                const id = decoded.id;

                categoriesCollection.find({clinic_id: ObjectID(id)}).toArray((err, items) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(items);
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

    app.post('/doctor-categories', (req, res) => {
        const token = req.headers['x-access-token'];

        jwt.verify(token, SECRET, function(err, decoded) {
            if (decoded) {
                const id = decoded.id;
                const category = {
                    categoryName: req.body.categoryName,
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
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(500).send('Something went wrong');
                }
            }
        });
    });

    app.post('/doctors/invite', (req, res) => {
        const token = req.headers['x-access-token'];

        jwt.verify(token, SECRET, function(err, decoded) {
            if (decoded) {
                const clinicId = decoded.id;
                const doctor = {
                    title: req.body.title,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    room: req.body.room,
                    email: req.body.email,
                    clinic_id: ObjectID(clinicId),
                    category_id : req.body.category_id,
                    status: 'invited'
                };

                // todo: send email

                doctorsCollection.insert(doctor, (err, result) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(result.ops[0]);
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