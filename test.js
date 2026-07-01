require("dotenv").config();
const { MongoClient } = require("mongodb");

async function test() {
  console.log("URI:", process.env.MONGO);

  const client = new MongoClient(process.env.MONGO, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    console.log("Connecting...");
    await client.connect();
    console.log("✅ Connected!");
    await client.close();
  } catch (err) {
    console.error("❌ Error:");
    console.error(err);
  }
}

test();