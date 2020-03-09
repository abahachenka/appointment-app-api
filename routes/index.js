const clinicsRouter = require('./clinics');
const accountRouter = require('./account');
const doctorsRouter = require('./doctors');

module.exports = function(app, db) {
    clinicsRouter(app, db);
    accountRouter(app, db);
    doctorsRouter(app, db);
};
