const { ObjectID } = require('mongodb');
const {checkRequestToken} = require('../helpers/account');

module.exports = function(app, db) {
    const collection = db.collection('clinic-address-cover');

    app.post('/clinic-address-cover', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            let buildings = req.body.buildings.split(',');
            buildings = buildings.map((building) => {
                return building.trim().toLowerCase();
            });

            const record = {
                place: req.body.place,
                street: req.body.street,
                buildings,
                clinic_id: ObjectID(decoded.id)
            };

            collection.insertOne(record, (err) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send({added: true});
                }
            });
        });
    });

    app.get('/clinic-address-cover', (req, res) => {
        checkRequestToken(req, res, (decoded) => {
            const query = {
                clinic_id: ObjectID(decoded.id)
            };

            collection.find(query).toArray((err, result) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(result);
                }
            });
        });
    });
};