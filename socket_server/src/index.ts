import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { client } from "./redis.config";
import { routes } from "./routes/routes";
import { admin, db } from "./firebase.config";
import { socket_middleware } from "./middleware/socket_middleware";
require("dotenv").config();

const app = express();
const server = createServer(app);
client.connect().catch((err) => {
  console.log("Redis Client Connection Error", err);
});
// client.on("error", (err) => console.log("Redis Client Error", err));

const io = new Server(server, { cors: { origin: ["http://localhost:4200"] } });
const port = 3000;

app.use(cors({ origin: "*" }));

app.use("/", routes);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
  // res.send('working server')
});


io.use(socket_middleware);

type UserMap = Record<string, string[]>;
let onlineUsers: UserMap = {};

io.on("connection", async (socket) => {
  onlineUsers[socket.id] = [];
  console.log("a user connected");

  socket.on("room:join", async (roomId: string) => {
    if (!roomId) return;
    socket.join(roomId);
    onlineUsers[socket.id].push(roomId);
    socket.to(roomId).emit("room:joined", roomId);
    console.log("joined" + " to " + roomId);
  });

  socket.on("room:leave", async (roomId: string) => {
    socket.leave(roomId);
    socket.to(roomId).emit("room:left", roomId);
    console.log("left" + " " + roomId);
  });

  socket.on("objects", async (roomId: string) => {
    if (!roomId) return;
    try {
      let objects = await client.hGet(`room:${roomId}`, "objects");
      if (!objects) {
        const doc = (await db.collection("projects").doc(roomId).get()).data()
          ?.objects;
        if (typeof doc === "string") {
          objects = doc;
          await client.hSet(`room:${roomId}`, {
            objects: doc,
          });
        }
      }

      socket.emit("objects", JSON.parse(objects || "[]"));
    } catch (error) {
      console.error(error);
    }

    console.log("objects");
  });

  socket.on(
    "objects:modified",
    async ({ objects, roomId }: { objects: any; roomId: string }) => {
      if (!objects || !roomId) return;
      await client.hSet(`room:${roomId}`, {
        objects: JSON.stringify(objects),
      });
      socket.to(roomId).emit("objects:modified", objects);
    }
  );

  socket.on(
    "mouse:move",
    async (data: { position: position; roomId: string }) => {
      const { position, roomId } = data;
      if (!position || !roomId) return;
      try {
        const presenseStr = await client.hGet(`room:${roomId}`, "presense");
        if (!presenseStr) {
          await client.hSet(`room:${roomId}`, {
            presense: JSON.stringify([
              { id: socket.id, mouse: data, expire: Date.now() },
            ]),
          });
        } else {
          let presense: { id: string; mouse: position; expire: number }[] =
            JSON.parse(presenseStr);
          presense = presense.filter((pre) => Date.now() - pre.expire < 10000);
          const index = presense.findIndex((ele) => ele.id === socket.id);
          if (index != -1) {
            presense[index] = {
              id: presense[index].id,
              mouse: position,
              expire: Date.now(),
            };
          } else {
            presense.push({
              id: socket.id,
              mouse: position,
              expire: Date.now(),
            });
          }
          await client.hSet(`room:${roomId}`, {
            presense: JSON.stringify(presense),
          });
          socket.to(roomId).emit("mouse:move", presense);
        }
      } catch (error: any) {
        console.log(error.message);
      }
    }
  );

  socket.on("disconnect", async () => {
    onlineUsers[socket.id].forEach(async (docId) => {
      try {
        const objects = await client.hGet(`room:${docId}`, "objects");
        if (!objects) return;
        await db
          .collection("projects")
          .doc(docId)
          .update({ objects: objects || "[]" });
        await client.del(`room:${docId}`);
      } catch (error) {
        console.error(error);
      }
    });
    delete onlineUsers[socket.id];
    console.log("user disconnected");
  });
});

server.listen(port, () => {
  console.log("listening on :" + `${port}`);
});

type position = { x: number; y: number };

module.exports = app;
