var Sequelize = require("sequelize");
const sequelize = new Sequelize("neondb"
,
"neondb_owner"
, "npg_dWiH4b9Epwos", {
host: "ep-sweet-glitter-atzc1uy2-pooler.c-9.us-east-1.aws.neon.tech",
port: 5432,
dialect: "postgres"
,
dialectOptions: {
ssl: {
require: true,
rejectUnauthorized: false,
},
clientMinMessages: "notice",
channelBinding: "require",
},
});
module.exports = sequelize;