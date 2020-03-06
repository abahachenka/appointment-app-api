const bcrypt = require('bcrypt');

module.exports = function(app, db) {
    const clinicsCollection = db.collection('clinics');
    // todo: add doctors check

    app.post('/auth', (req, res) => {
        const userDetails = {
            email: req.body.email
        };

        if (!req.body.email || !req.body.password) {
            res.status(406).send('Email and password must be provided');
            return;
        }

        clinicsCollection.findOne(userDetails, (err, user) => {
            if (err) {
                res.send(err);
            } else {
                if (user && user.password) {
                    const result = bcrypt.compareSync(req.body.password, user.password);
                    
                    if (result === true) {
                        res.send(user);
                    } else {
                        res.status(401).send('Invalid username or password');
                    }
                } else {
                    res.status(401).send('Invalid username or password');
                }
            }
        });
    });
}