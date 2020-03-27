const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;

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

/**
  * The function searches through available emails to check 
  * if the submitted email is unique
  */
const checkEmail = (db, email, cb) => {

    // searching among clinics emails
    db.collection('clinics')
        .find({email})
        .toArray((err, clinicEmails) => {
            if (err) {
                cb(err);
            }

            if (clinicEmails && clinicEmails.length) {
                cb('This email is already registered')
            } else if (clinicEmails.length === 0) {

                // searching among doctors emails
                db.collection('doctors')
                    .find({email})
                    .toArray((err, doctorEmails) => {
                        if (err) {
                            cb(err);
                        }

                        if (doctorEmails && doctorEmails.length) {
                            cb('This email is already registered')
                        } else if (doctorEmails.length === 0) {
                            cb('', true);
                        }
                    })
            }
        });
};

module.exports.checkRequestToken = checkRequestToken;
module.exports.checkEmail = checkEmail;