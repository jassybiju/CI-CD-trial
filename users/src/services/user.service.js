import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { connectRabbitMq } from "./rabbitMqService.js";

export class UserService {
  constructor(users) {
    this.users = users;
  }

  async create(input) {
    if (
      !input.username?.trim() ||
      !input.email?.includes("@") ||
      !input.password ||
      input.password.length < 8
    ) {
      throw new Error(
        "username, a valid email, and password (8+ characters) are required",
      );
    }
    const now = new Date();
    const user = {
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 12),
      bio: typeof input.bio === "string" ? input.bio : "",
      createdAt: now,
      updatedAt: now,
    };
    const result = await this.users.insertOne(user);
    return this.serialize({ ...user, _id: result.insertedId });
  }

  async list() {
    return (
      await this.users.find({}, { projection: { passwordHash: 0 } }).toArray()
    ).map(this.serialize);
  }

  async getById(id) {
    const filter = this.idFilter(id);
    if (!filter) return null;
    const user = await this.users.findOne(filter, {
      projection: { passwordHash: 0 },
    });
    return user && this.serialize(user);
  }

  async update(id, input) {
    const filter = this.idFilter(id);
    if (!filter) return null;
    const update = {};
    for (const field of ["username", "bio"])
      if (typeof input[field] === "string") update[field] = input[field].trim();
    if (!Object.keys(update).length)
      throw new Error("Provide username or bio to update");
    update.updatedAt = new Date();
    const user = await this.users.findOneAndUpdate(
      filter,
      { $set: update },
      {
        returnDocument: "after",
        projection: { passwordHash: 0 },
      },
    );
    return user && this.serialize(user);
  }

  async remove(id) {
    const filter = this.idFilter(id);
    if (!filter) {
      return null
    }
    // const res = await this.users.deleteOne(filter)

    // if (res.deletedCount == 0) return null

    const { channel } =await connectRabbitMq()

    await channel.assertExchange('users.events', 'direct', { durable: true })

    const event = {
      event: "user.deleted",
      userId: "id"
    }
    channel.publish('users.events', 'user.deleted', Buffer.from(JSON.stringify(event)), { persistent: true })

    return {
      id
    }

  }

  async authenticate(email, password) {
    const user = await this.users.findOne({
      email: String(email || "")
        .trim()
        .toLowerCase(),
    });
    if (
      !user ||
      !(await bcrypt.compare(String(password || ""), user.passwordHash))
    )
      return null;
    return user;
  }

  async getRawById(id) {
    const filter = this.idFilter(id);
    return filter && this.users.findOne(filter);
  }

  serialize = ({ passwordHash, ...user }) => ({
    ...user,
    id: user._id.toString(),
    _id: undefined,
  });
  idFilter = (id) => (ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null);
}
