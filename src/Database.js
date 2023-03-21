import mongoose from 'mongoose';

export const createMongodbConnectionString = function () {
    return 'mongodb://' + process.env.MONGODB_USER + ':' + process.env.MONGODB_PASS + '@' + process.env.MONGODB_IP + ':' + process.env.MONGODB_PORT + '/' + process.env.MONGO_INITDB_DATABASE
}

export const databaseConnect = async function () {
    await mongoose.connect(createMongodbConnectionString());
}