const clinicsRouter = require('./clinics');
const accountRouter = require('./account');

module.exports = function(app, db) {
    clinicsRouter(app, db);
    accountRouter(app, db);
};
