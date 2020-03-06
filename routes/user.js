module.exports = function(app, db) {
    const clinicsCollection = db.collection('clinics');

    app.post('/signin', (req, res) => {
        const userDetails = {
            email: req.body.email
        };

        clinicsCollection.findOne(userDetails, (err, user) => {
            if (err) {
                res.send(err);
            } else {
                if (user && user.password === req.body.password) {
                    res.send(user);
                } else {
                    res.status(401).send('Invalid username or password');
                }
            }
        });
    });
}