const amqp = require('amqplib');
require('dotenv').config();

let channel = null;
let connection = null;

// Connect to RabbitMQ
const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('RabbitMQ connected and channel created');

    connection.on('error', (err) => console.error('RabbitMQ connection error:', err));
    process.on('SIGINT', closeRabbitMQ);
  } catch (error) {
    console.error('Unable to connect to RabbitMQ:', error);
  }
};

// Gracefully close RabbitMQ
const closeRabbitMQ = async () => {
  if (channel) await channel.close();
  if (connection) await connection.close();
  console.log('RabbitMQ connection closed');
  process.exit(0);
};

// Create queue if not exists
const createQueue = async (queueName) => {
  if (!channel) throw new Error('RabbitMQ channel not available');
  await channel.assertQueue(queueName, { durable: true });
};

// Send message to queue
const sendToQueue = async (queueName, message) => {
  try {
    await createQueue(queueName);
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log(`Message sent to queue '${queueName}'`);
  } catch (error) {
    console.error(`Error sending message to queue '${queueName}':`, error);
  }
};

// Consume messages from queue
const consumeQueue = async (queueName, callback) => {
  try {
    await createQueue(queueName);
    channel.consume(queueName, (msg) => {
      if (msg) {
        callback(JSON.parse(msg.content.toString()));
        channel.ack(msg);
      }
    });
    console.log(`Consumer registered for queue '${queueName}'`);
  } catch (error) {
    console.error(`Error consuming from queue '${queueName}':`, error);
  }
};

module.exports = {
  connectRabbitMQ,
  sendToQueue,
  consumeQueue
};
