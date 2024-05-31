const { kafka } = require("./client");

async function init() {
  const admin = kafka.admin();
  console.log("Admin connecting...");
  admin.connect();
  console.log("Adming Connection Success...");

  console.log("Creating Topic bookings");
  
  
  
  try {
    await admin.createTopics(
      {
        topics: [
          {
            topic: "bookings",
            numPartitions: 2,
          },
          {
            topic: "movieBookings",
            numPartitions: 2,
          },
          {
            topic: "movies",
            numPartitions: 1,
          },
        ],
      },
      
      console.log("Topic Created Success bookings")
    );
    const topics = await admin.listTopics();
    console.log('Topics:', topics);
  
  } catch (e) {
    if (e.type === "TOPIC_ALREADY_EXISTS") {
      console.log("Topic already exists");
    } else {
      console.error("Error creating topic:", e);
    }
  } finally {
    await admin.disconnect();
  }

  console.log("Disconnecting Admin..");
  await admin.disconnect();
}

init();
