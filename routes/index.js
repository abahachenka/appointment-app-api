const clinicsRouter = require('./clinics');
const accountRouter = require('./account');
const doctorsRouter = require('./doctors');
const clinicAddressCoverRouter = require('./clinic-address-cover');
const doctorAddressCoverRouter = require('./doctor-address-cover');
const appointmentsRouter = require('./appointments');

module.exports = function(app, db) {
    clinicsRouter(app, db);
    accountRouter(app, db);
    doctorsRouter(app, db);
    clinicAddressCoverRouter(app, db);
    doctorAddressCoverRouter(app, db);
    appointmentsRouter(app, db);
};
