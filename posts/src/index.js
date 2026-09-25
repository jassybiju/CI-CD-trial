import express from "express";
import { MongoClient } from "mongodb";
import { PostService } from "./services/post.service.js";
import './services/rabbitMqService.js'
const app = express();
const port = Number(process.env.PORT || 3002);
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/posts";
app.use(express.json());

const client = new MongoClient(mongoUrl);
await client.connect();
const postService = new PostService(client.db().collection("posts"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.post("/posts", async (req, res, next) => {
  try {
    res.status(201).json(await postService.create(req.body));
  } catch (error) {
    console.log(error)
    error.status = 400;
    next(error);
  }
});
app.get("/posts", async (_req, res, next) => {
  try {
    res.json(await postService.list());
  } catch (error) {
    next(error);
  }
});
app.get("/posts/:postId", async (req, res, next) => {
  try {
    const post = await postService.getById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    next(error);
  }
});
app.patch("/posts/:postId", async (req, res, next) => {
  try {
    const post = await postService.update(req.params.postId, req.body);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    error.status = 400;
    next(error);
  }
});
app.delete("/posts/:postId", async (req, res, next) => {
  try {
    if (!(await postService.remove(req.params.postId)))
      return res.status(404).json({ error: "Post not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
app.use((error, _req, res, _next) => {
  if (error.status === 400)
    return res.status(400).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});
app.listen(port, () => console.log(`Posts service listening on ${port}`));
