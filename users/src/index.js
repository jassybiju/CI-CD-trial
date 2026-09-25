import express from "express";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import { UserService } from "./services/user.service.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/users";
const jwtSecret = process.env.JWT_SECRET || "development-only-secret";
app.use(express.json());

const client = new MongoClient(mongoUrl);
await client.connect();
const users = client.db().collection("users");
await users.createIndex({ email: 1 }, { unique: true });
const userService = new UserService(users);
const tokenFor = (user) =>
  jwt.sign({ sub: user._id.toString(), email: user.email }, jwtSecret, {
    expiresIn: "1h",
  });

function authenticate(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.auth = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.post("/users", async (req, res, next) => {
  try {
    console.log(req.body)
    res.status(201).json(await userService.create(req.body));
  } catch (error) {
    error.status = 400;
    next(error);
  }
});
app.get("/users", async (_req, res, next) => {
  try {
    res.json(await userService.list());
  } catch (error) {
    next(error);
  }
});
app.get(
  ["/users/:userId", "/internal/users/:userId"],
  async (req, res, next) => {
    try {
      const user = await userService.getById(req.params.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      next(error);
    }
  },
);
app.patch("/users/:userId", async (req, res, next) => {
  try {
    console.log(req.params.userId)
    const user = await userService.update(req.params.userId, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    error.status = 400;
    next(error);
  }
});
app.delete("/users/:userId", async (req, res, next) => {
  try {
    const resp = await userService.remove(req.params.userId)
    console.log(resp,1)
    if(!res)
      return res.status(404).json({ error: "Users not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/auth/login", async (req, res, next) => {
  try {
    const user = await userService.authenticate(
      req.body.email,
      req.body.password,
    );
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });
    res.json({ token: tokenFor(user), user: userService.serialize(user) });
  } catch (error) {
    next(error);
  }
});
app.post("/auth/logout", authenticate, (_req, res) => res.status(204).end());
app.post("/auth/refresh", authenticate, async (req, res, next) => {
  try {
    const user = await userService.getRawById(req.auth.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ token: tokenFor(user) });
  } catch (error) {
    next(error);
  }
});
app.get("/auth/me", authenticate, async (req, res, next) => {
  try {
    const user = await userService.getById(req.auth.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error?.code === 11000)
    return res.status(409).json({ error: "Email already exists" });
  if (error.status === 400)
    return res.status(400).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});
app.listen(port, () => console.log(`Users service listening on ${port}`));
