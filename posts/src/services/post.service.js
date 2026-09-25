import { ObjectId } from "mongodb";

export class PostService {
  constructor(posts) {
    this.posts = posts;
  }

  async create(input) {
    const content = this.contentFrom(input);
    if (!content) throw new Error("content is required");


    // checking if user exists
    console.log('http://users-srv/internal/users/'+input.userId)

    const res = await fetch('http://users-srv/internal/users/'+input.userId)
    console.log(res)
    if(res.status == 404){
      throw new Error("User Not Foudn")
    }
    if(!res.ok){
      throw new Error("User Service not available")
    }

    const user = await res.json()
    const now = new Date();
    const post = { content, createdAt: now, updatedAt: now, userId: user.id };
    const result = await this.posts.insertOne(post);
    return this.serialize({ ...post, _id: result.insertedId });
  }

  async list() {
    return (await this.posts.find().sort({ createdAt: -1 }).toArray()).map(
      this.serialize,
    );
  }

  async getById(id) {
    const filter = this.idFilter(id);
    const post = filter && (await this.posts.findOne(filter));
    return post && this.serialize(post);
  }

  async update(id, input) {
    const filter = this.idFilter(id);
    if (!filter) return null;
    const content = this.contentFrom(input);
    if (!content) throw new Error("content is required");
    const post = await this.posts.findOneAndUpdate(
      filter,
      { $set: { content, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    return post && this.serialize(post);
  }

  async remove(id) {
    const filter = this.idFilter(id);
    return filter && (await this.posts.deleteOne(filter)).deletedCount > 0;
  }

  contentFrom = (body) =>
    typeof body.content === "string" ? body.content.trim() : "";
  idFilter = (id) => (ObjectId.isValid(id) ? { _id: new ObjectId(id) } : null);
  serialize = (post) => ({ ...post, id: post._id.toString(), _id: undefined });
}
