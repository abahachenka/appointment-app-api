const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;
const { ObjectID } = require('mongodb');


module.exports = function(app, db) {
    const clinicsCollection = db.collection('clinics');
    // todo: add doctors check

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
                    const result = bcrypt.compareSync(req.body.password, account.password);
                    
                    if (result === true) {
                        const token = jwt.sign({ id: account._id }, SECRET, {
                          expiresIn: 86400 // expires in 24 hours
                        });
                        res.status(200).send({token: token});

                    } else {
                        res.status(401).send('Invalid username or password');
                    }
                } else {
                    res.status(401).send('Invalid username or password');
                }
            }
        });
    });


    app.post('/auth/account', (req, res) => {
        // todo: replace with a proper header
        // const token = req.headers['x-access-token'];
        const token = req.body.token;

        jwt.verify(token, SECRET, function(err, decoded) {
            const id = decoded.id;
            const details = {"_id": ObjectID(id)};

            clinicsCollection.findOne(details, (err, item) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(item);
                }
            });
        });
    });

    app.post('/auth/logout', (req, res) => {

    });
}