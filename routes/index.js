const clinicsRouter = require('./clinics');

module.exports = function(app, db) {
    clinicsRouter(app, db);
};
