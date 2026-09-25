import amqp from 'amqplib'

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'

export async function connectRabbitMq(){
    const connection = await amqp.connect(RABBITMQ_URL)
    const channel = await connection.createChannel()

    return {connection, channel}

}