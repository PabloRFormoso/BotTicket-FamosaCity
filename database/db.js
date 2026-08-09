const mongoose = require('mongoose');

let connectionPromise = null;

async function connectDB() {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI não encontrada no arquivo .env');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000
    }).then(() => {
        console.log('✅ MongoDB conectado');
        return mongoose.connection;
    }).catch((error) => {
        connectionPromise = null;
        throw error;
    });

    return connectionPromise;
}

module.exports = connectDB;
