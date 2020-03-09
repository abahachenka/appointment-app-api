const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;

module.exports = function(app, db) {
    const collection = db.collection('doctor-categories');

    app.get('/doctor-categories', (req, res) => {
        collection.find({}).toArray((err, items) => {
             if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(items);
            }
        });
    });

    app.post('/doctor-categories', (req, res) => {
        const token = req.body.token;

        jwt.verify(token, SECRET, function(err, decoded) {
            if (decoded) {
                const id = decoded.id;
                const category = {
                    categoryName: req.body.categoryName,
                    clinic_id: ObjectID(id)
                };

                collection.insert(category, (err, result) => {
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