const functions = require('firebase-functions');
const app = require('../app'); // Importa tu app.js

// Usa tu app.js como middleware
exports.app = functions.https.onRequest(app);
