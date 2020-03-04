const { ObjectID } = require('mongodb');

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
        const clinic = {
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            password: req.body.password
        };

        collection.insert(clinic, (err, result) => {
            if (err) {
                res.send(err);
            } else {
                res.send(result.ops[0]);
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