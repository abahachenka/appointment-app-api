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

const validateEmail = (email) => {
    const emailRule = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return emailRule.test(email);
}

const validatePassword = (password) => {
    const passRule = /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/g;
    let error = '';
    let isValid = passRule.test(password);

    if (!isValid) {
        error = `Password must be: <br/>
            -At least one upper case English letter<br/>
            -At least one lower case English letter<br/>
            -At least one digit<br/>
            -At least one special character<br/>
            -Minimum eight characters in length`;
    }

    return {
        isValid, 
        error
    };
}

module.exports.checkRequestToken = checkRequestToken;
module.exports.checkEmail = checkEmail;
module.exports.validateEmail = validateEmail;
module.exports.validatePassword = validatePassword;