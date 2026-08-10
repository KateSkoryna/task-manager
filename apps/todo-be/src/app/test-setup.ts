/// <reference types="jest" />
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;
  process.env.FIREBASE_PROJECT_ID = 'demo-test';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

  await mongoose.connect(uri);
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});
export const connectDB = async () => {
  // This will be handled by beforeAll
};

export const closeDB = async () => {
  // This will be handled by afterAll
};

export const clearDB = async () => {
  // This will be handled by beforeEach
};
