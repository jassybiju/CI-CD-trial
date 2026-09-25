import amqp from 'amqplib'

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
console.log(123)
export async function connectRabbitMq() {
    const connection = await amqp.connect(RABBITMQ_URL)
    const channel = await connection.createChannel()

    return { connection, channel }

}

const { channel } = await connectRabbitMq()

await channel.assertExchange('users.events', 'direct', { durable: true })

await channel.assertQueue('posts.user-deleted', { durable: true })

await channel.bindQueue('posts.user-deleted', 'users.events', 'user.deleted')



channel.consume('posts.user-deleted', (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());

    console.log(event);

    channel.ack(msg)
})