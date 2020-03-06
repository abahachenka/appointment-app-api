const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');

module.exports = function(app, db) {
    const collection = db.collection('clinics');

    // Get all clinics
    app.get('/clinics', (req, res) => {
        collection.find({}).toArray((err, items) => {
            if (err) {
                res.send(err);
            } else {
                res.send(items);
            }
        });
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

        if (!req.body.password) {
            res.status(406).send('Password must be specified');
            return;
        }

        if (req.body.password !== req.body.confirmPassword) {
            res.status(406).send('Passwords do not match');
            return;
        }

        const clinic = {
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, salt)
        };

        collection.insert(clinic, (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(result.ops[0]);
            }
        });
    });

    // Get a single clinic
    app.get('/clinics/:id', (req, res) => {
        const id = req.params.id;
        const details = {"_id": ObjectID(id)};

        collection.findOne(details, (err, item) => {
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

        collection.updateOne(details, { $set: {...clinic} }, (err, item) => {
            if (err) {
                res.send(err);
            } else {
                res.send('The record ' + id + ' has been updated');
            }
        });
    });

    // Deleting a clinic
    app.delete('/clinics/:id', (req, res) => {
        const id = req.params.id;
        const details = {"_id": ObjectID(id)};

        collection.remove(details, (err, item) => {
            if (err) {
                res.send(err);
            } else {
                res.send('Note ' + id + ' deleted!');
            }
        });
    });
};