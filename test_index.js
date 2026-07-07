const mongoose = require('mongoose');
const Job = require('./server/models/Job');
require('dotenv').config({path: './server/.env'});

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://test:test@cluster0.mongodb.net/test').then(async () => {
    try {
        await Job.collection.createIndex({ geoLocation: "2dsphere" });
        console.log("Index created");
    } catch(e) {
        console.error("Index error:", e);
    }
    process.exit(0);
});
