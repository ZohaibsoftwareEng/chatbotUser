const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const bodyParser = require("body-parser");
const randomName = require("node-random-name");
let RedisStore = require("connect-redis")(session);
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");
const { instrument } = require("@socket.io/admin-ui");
const { UserChat, Room } = require("./models/UserChat");
const GroupChat = require("./models/GroupChat");
const userRoutes = require("./routes/userRoutes");
const chatBotRoutes = require("./routes/chatBotRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messagesRoutes = require("./routes/messageRoutes");
const Message = require("./models/Message");
const User = require("./models/User");

const {
  client: redisClient,
  exists,
  set,
  get,
  hgetall,
  sadd,
  zadd,
  hmget,
  smembers,
  sismember,
  srem,
  hmset,
  incr,
  sub,
  auth: runRedisAuth,
} = require("./redis");
const {
  createUser,
  makeUsernameKey,
  createPrivateRoom,
  sanitise,
  getMessages,
} = require("./utils");
const { PORT, SERVER_ID, connectDB } = require("./config");
const Channel = require("./models/Channel");

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000/",
      "http://localhost:3000",
      "http://127.0.0.1:5500/",
      "http://127.0.0.1:5500",
      "https://admin.socket.io",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

const server = require("http").createServer(app);
connectDB();

/** @type {SocketIO.Server} */
const io = require("socket.io")(server, {
  cors: {
    origin: [
      "http://localhost:3000/",
      "http://localhost:3000",
      "http://127.0.0.1:5500/",
      "http://127.0.0.1:5500",
      "https://admin.socket.io",
    ],
    allowedHeaders: ["Content-Type", "application/json"],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
  mode: "development",
});

const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: "keyboard cat",
  saveUninitialized: true,
  resave: true,
});

const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.sendStatus(403);
  }
  next();
};

const publish = (type, data) => {
  const outgoing = {
    serverId: SERVER_ID,
    type,
    data,
  };
  redisClient.publish("MESSAGES", JSON.stringify(outgoing));
};

const initPubSub = () => {
  /** We don't use channels here, since the contained message contains all the necessary data. */
  sub.on("message", (_, message) => {
    /**
     * @type {{
     *   serverId: string;
     *   type: string;
     *   data: object;
     * }}
     **/
    const { serverId, type, data } = JSON.parse(message);
    /** We don't handle the pub/sub messages if the server is the same */
    if (serverId === SERVER_ID) {
      return;
    }
    io.emit(type, data);
  });
  sub.subscribe("MESSAGES");
};

(async () => {
  await runRedisAuth();
  runApp();
})();

async function runApp() {
  const repoLinks = await fs
    .readFile(path.dirname(__dirname) + "/repo.json")
    .then((x) => JSON.parse(x.toString()));

  app.use(bodyParser.json());
  app.use(sessionMiddleware);
 
  app.use("/", express.static(path.dirname(__dirname) + "/client/build"));
  app.use("/api/users", userRoutes);
  app.use("/api/chatbots", chatBotRoutes);
  app.use("/api/channels", channelRoutes);
  app.use("/api", messagesRoutes);
  app.use("/static", express.static(path.join(__dirname, "../public")));

  initPubSub();

  /** Store session in redis. */
  io.use((socket, next) => {
    /** @ts-ignore */
    sessionMiddleware(socket.request, socket.request.res || {}, next);
  });

  // @ts-ignore
  // @ts-ignore
  app.get("/links", (req, res) => {
    return res.send(repoLinks);
  });

  io.on("connection", async (socket) => {
    socket.request.session.user = {
      id: "67c0055d2003709bebc8f3df",
      username: "zohaibhassan",
    };
    if (socket.request.session.user === undefined) {
      return;
    }

    const userId = "67c0055d2003709bebc8f3df";
    // await sadd("online_users", userId);

    const msg = {
      ...socket.request.session.user,
      online: true,
    };

    publish("user.connected", msg);
    socket.broadcast.emit("user.connected", msg);

    socket.on("room.join", (id) => {
      socket.join(`room:${id}`);
    });

    // Simplified message handler to debug the issue
    socket.on(
      "message",
      /**
       * @param {{
       *  from: string
       *  date: number
       *  message: string
       *  roomId: string
       * }} message
       **/
      async (message) => {
        message = { ...message, message: sanitise(message.message) };
        const roomKey = `room:${message.roomId}`;
    
        const reqChannel = await Channel.findOne({
          displayName: message.roomId,
        });
    
        const messageToSave = {
          editedBy: message.from,
          channel: reqChannel ? reqChannel._id : null,
          message: message.message,
          type: "Simple",
        };
    
        try {
          const savedMessage = new Message(messageToSave);
          await savedMessage.save();
    
          const isPrivate = !(await exists(`${roomKey}:name`));
          const roomHasMessages = await exists(roomKey);
    
          if (isPrivate && !roomHasMessages) {
            const ids = message.roomId.split(":");
            const msg = {
              id: message.roomId,
              names: [
                await hmget(`user:${ids[0]}`, "username"),
                await hmget(`user:${ids[1]}`, "username"),
              ],
            };
    
            publish("show.room", msg);
            socket.broadcast.emit(`show.room`, msg);
          }
    
          // Add message ID before storing it
          const broadcastMessage = { ...message, id: savedMessage._id };
          await zadd(roomKey, "" + message.date, JSON.stringify(broadcastMessage));
    
          publish("message", broadcastMessage);
          io.to(roomKey).emit("message", broadcastMessage);
        } catch (error) {
          if (error.name === "ValidatorError" && error.path === "channel") {
            console.error("Channel is required:", error.message);
          } else {
            console.error("An error occurred:", error);
          }
        }
      }
    );
    
    socket.on("disconnect", async () => {
      await srem("online_users", userId);
      const disconnectMsg = {
        ...socket.request.session.user,
        online: false,
      };
      publish("user.disconnected", disconnectMsg);
      socket.broadcast.emit("user.disconnected", disconnectMsg);
    });
  });

  /** Fetch a randomly generated name so users don't have collisions when registering a new user. */
  // @ts-ignore
  app.get("/randomname", (_, res) => {
    return res.send(randomName({ first: true }));
  });

  /** The request the client sends to check if it has the user is cached. */
  // @ts-ignore
  app.get("/me", (req, res) => {
    /** @ts-ignore */
    const { user } = req.session;
    if (user) {
      return res.json(user);
    }
    /** User not found */
    return res.json(null);
  });

  /** Login/register login */
  // @ts-ignore
  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const usernameKey = makeUsernameKey(email);
    const userExists = await exists(usernameKey);

    if (!userExists) {
      // Check if user exists in MongoDB even if not in Redis
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        // User exists in MongoDB but not in Redis - sync them
        const mongoId = existingUser._id.toString();
        const userKey = `user:${mongoId}`;

        // Add to Redis
        await set(usernameKey, userKey);
        await hmset(userKey, [
          "username",
          email,
          "password",
          existingUser.password,
          "id",
          mongoId,
        ]);
        await sadd(`user:${mongoId}:rooms`, `${0}`); // Default room

        // Check password
        if (await bcrypt.compare(password, existingUser.password)) {
          /** @ts-ignore */
          req.session.user = { id: mongoId, email };
          return res.status(200).json({ id: mongoId, email });
        } else {
          return res.status(401).json({ message: "Invalid password" });
        }
      }

      // Truly new user - Create in Redis and MongoDB
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create MongoDB user first to get a proper ObjectId
      const newUser = new User({
        email,
        password: hashedPassword,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16), // Generate random color
      });
      await newUser.save();

      const mongoId = newUser._id.toString(); // Get MongoDB ObjectId as string
      const userKey = `user:${mongoId}`;

      // Now save in Redis with MongoDB's ID
      await set(usernameKey, userKey);
      await hmset(userKey, [
        "email",
        email,
        "password",
        hashedPassword,
        "id",
        mongoId,
      ]);
      await sadd(`user:${mongoId}:rooms`, `${0}`); // Default room

      /** @ts-ignore */
      req.session.user = { id: mongoId, email };
    
      return res.status(201).json({ id: mongoId, email });
    } else {
      // Existing User - Verify Password
      const userKey = await get(usernameKey);
      const mongoId = userKey.split(":").pop(); // Extract ID from Redis key
      const data = await hgetall(userKey);

      // Update Redis entry to include ID if it's not already there
      if (!data.id) {
        await hmset(userKey, ["id", mongoId]);
      }

      if (await bcrypt.compare(password, data.password)) {
        // Use mongoose.Types.ObjectId to convert string to ObjectId when querying
        const user = await User.findById(mongoId);

        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found in database" });
        }

        /** @ts-ignore */
        req.session.user = { id: user._id.toString(), email: user.email };
        

        return res
          .status(200)
          .json({ id: user._id.toString(), email: user.email });
      } else {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    return res.status(401).json({ message: "Invalid username or password" });
  });
  // @ts-ignore
  app.post("/logout", auth, (req, res) => {
    req.session.destroy(() => {});
    return res.sendStatus(200);
  });

  /**
   * Create a private room and add users to it
   */
  // @ts-ignore
  app.post("/room", async (req, res) => {
    const { user1, user2 } = {
      user1: req.body.user1,
      user2: req.body.user2,
    };

    const [result, hasError] = await createPrivateRoom(user1, user2);
    if (hasError) {
      return res.sendStatus(400);
    }
    return res.status(201).send(result);
  });

  /** Fetch messages from the general chat (just to avoid loading them only once the user was logged in.) */
  // @ts-ignore
  app.get("/room/0/preload", async (req, res) => {
    const roomId = "0";
    try {
      let name = await get(`room:${roomId}:name`);
      const messages = await getMessages(roomId, 0, 20);
      return res.status(200).send({ id: roomId, name, messages });
    } catch (err) {
      return res.status(400).send(err);
    }
  });

  /** Fetch messages from a selected room */
  // @ts-ignore
  app.get("/room/:id/messages", auth, async (req, res) => {
    const roomId = req.params.id;
    // @ts-ignore
    const offset = +req.query.offset;
    // @ts-ignore
    const size = +req.query.size;
    try {
      const messages = await getMessages(roomId, offset, size);
      return res.status(200).send(messages);
    } catch (err) {
      return res.status(400).send(err);
    }
  });


  app.get(`/users`, async (req, res) => {
    try {
      // Fetch all users from MongoDB
      const usersData = await User.find({}, "_id username");

      // Fetch all online users from Redis in one go
      const onlineUsers = new Set(await smembers("online_users"));

      // Create response object
      const users = {};

      for (const user of usersData) {
        const userId = user._id.toString();

        users[userId] = {
          id: userId,
          username: user.email,
          online: onlineUsers.has(userId), // Check if the user is online
        };
      }

      return res.send(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.sendStatus(500);
    }
  });

  /**
   * Get rooms for the selected user.
   * TODO: Add middleware and protect the other user info.
   */
  // @ts-ignore
  app.get(`/rooms/:userId`, auth, async (req, res) => {
    const userId = req.params.userId;
    /** We got the room ids */
    const roomIds = await smembers(`user:${userId}:rooms`);
    const rooms = [];
    for (let x = 0; x < roomIds.length; x++) {
      const roomId = roomIds[x];

      let name = await get(`room:${roomId}:name`);
      /** It's a room without a name, likey the one with private messages */
      if (!name) {
        /**
         * Make sure we don't add private rooms with empty messages
         * It's okay to add custom (named rooms)
         */
        const roomExists = await exists(`room:${roomId}`);
        if (!roomExists) {
          continue;
        }

        const userIds = roomId.split(":");
        if (userIds.length !== 2) {
          return res.sendStatus(400);
        }
        rooms.push({
          id: roomId,
          names: [
            await hmget(`user:${userIds[0]}`, "username"),
            await hmget(`user:${userIds[1]}`, "username"),
          ],
        });
      } else {
        rooms.push({ id: roomId, names: [name] });
      }
    }
    res.status(200).send(rooms);
  });

  app.get("/api/conversations/:userId", auth, async (req, res) => {
    try {
      const conversations = await UserChat.getUserConversations(
        req.params.userId
      );
      return res.json({ conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get messages for a specific room
  app.get("/api/messages/:roomId", auth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const skip = parseInt(req.query.skip) || 0;

      const messages = await UserChat.getRoomMessages(
        req.params.roomId,
        limit,
        skip
      );
      return res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);

      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Mark messages as read
  app.post("/api/messages/:roomId/read", auth, async (req, res) => {
    try {
      await UserChat.markMessagesAsRead(req.params.roomId, req.session.user.id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });
  app.get("/api/group-messages/:roomId", auth, async (req, res) => {
    try {
      const groupChat = await GroupChat.findOne({ roomId: req.params.roomId });
      if (!groupChat) {
        return res.json({ messages: [] });
      }

      return res.json({
        messages: groupChat.messages.sort((a, b) => b.timestamp - a.timestamp),
      });
    } catch (error) {
      console.error("Error fetching group messages:", error);
      return res.status(500).json({ error: "Failed to fetch group messages" });
    }
  });

  if (process.env.PORT) {
    server.listen(+PORT, "0.0.0.0", () =>
      console.log(`Listening on ${PORT}...`)
    );
  } else {
    server.listen(+PORT, () => console.log(`Listening on ${PORT}...`));
  }
}
