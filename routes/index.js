const clinicsRouter = require('./clinics');
const userRouter = require('./user');

module.exports = function(app, db) {
    clinicsRouter(app, db);
    userRouter(app, db);
};
