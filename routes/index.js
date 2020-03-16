const clinicsRouter = require('./clinics');
const accountRouter = require('./account');
const doctorsRouter = require('./doctors');
const addressCoverRouter = require('./address-cover');
const appointmentsRouter = require('./appointments');

module.exports = function(app, db) {
    clinicsRouter(app, db);
    accountRouter(app, db);
    doctorsRouter(app, db);
    addressCoverRouter(app, db);
    appointmentsRouter(app, db);
};
