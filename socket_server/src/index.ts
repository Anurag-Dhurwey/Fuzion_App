import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { client } from "./redis.config";
import { routes } from "./routes/routes";
import { admin, db } from "./firebase.config";
import { socket_middleware } from "./middleware/socket_middleware";
import { IObjectOptions, Project } from "../types";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
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
// let last_updation_of_objects: "updating" | null | number = null;

async function saveObjsToDb(
  docId: string,
  socket?: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  try {
    const objects = await client.hGet(`room:${docId}`, "objects");
    if (!objects) return false;
    await db.collection("projects").doc(docId).update({ objects: objects });
    if (socket) {
      socket.emit("saveObjectsToDB:succeeded", docId);
    }
    console.log("saved");
    return true;
  } catch (error) {
    if (socket) {
      socket.emit("saveObjectsToDB:failed", docId);
    }
    return false;
  }
}

const getSocketIdsInRoom = (room: string) => {
  const roomObject = io.sockets.adapter.rooms.get(room);
  // io.sockets.adapter.rooms.get(room)
  if (roomObject) {
    // const socketIds = r;
    return [...roomObject];
  }
  return [];
};

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

  socket.on("project", async (roomId: string) => {
    if (!roomId) return;
    try {
      const doc = await db.collection("projects").doc(roomId).get();

      const pro = doc.data() as Project | undefined;
      if (pro) {
        pro.id = doc.id;
        let objects = await client.hGet(`room:${roomId}`, "objects");
        // console.log({objects});
        if (objects) {
          pro.objects = objects;
        }else{
          await client.hSet(`room:${roomId}`, {
            objects: pro.objects,
          });
        }
        socket.emit("project", pro);
      }
    } catch (error) {
      console.error(error);
    }

    console.log("project");
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

      socket.emit("objects", objects);
    } catch (error) {
      console.error(error);
    }

    console.log("objects");
  });

  socket.on(
    "objects:modified",
    async ({
      objects,
      roomId,
      method,
    }: {
      objects: IObjectOptions | IObjectOptions[];
      roomId: string;
      method: "push" | "reset" | "popAndPush" | "replace" | "delete";
    }) => {
      if (!objects || !roomId) return;

      if (!Array.isArray(objects)) {
        objects = [objects];
      }
      try {
        let data: IObjectOptions[] = JSON.parse(
          (await client.hGet(`room:${roomId}`, "objects")) || "[]"
        );
        if (method == "push") {
          objects.forEach((obj) => {
            data.unshift(obj);
          });
        } else if (method === "popAndPush") {
          data[0] = objects[0];
        } else if (method === "replace") {
          objects.forEach((item) => {
            const i = data.findIndex((obj) => obj._id == item._id);
            if (i >= 0) {
              data[i] = item;
            }else{
              data.unshift(item);
            }
          });
        } else if (method == "delete") {
          objects.forEach((obj) => {
            data = data.filter((item) => item._id != obj._id);
          });
        } else if (method === "reset") {
          data = objects;
        }
        await client.hSet(`room:${roomId}`, {
          objects: JSON.stringify(data),
        });
        // console.log( (await client.hGet(`room:${roomId}`, "objects")) )
        socket.to(roomId).emit("objects:modified", objects, method);
      } catch (error) {
        console.error(error);
      }
    }
  );

  socket.on("saveObjectsToDB", (docId) => {
    saveObjsToDb(docId, socket);
  });

  socket.on("saveObjectsToDB:succeeded", (docId) => {
    socket.to(docId).emit("saveObjectsToDB:succeeded", docId);
  });

  socket.on("saveObjectsToDB:failed", (docId) => {
    socket.to(docId).emit("saveObjectsToDB:failed", docId);
  });

  socket.on(
    "mouse:move",
    async (data: { position: position; roomId: string }) => {
      const { position, roomId } = data;
      if (!position || !roomId) return;
      socket.to(roomId).emit("mouse:move", { _id: socket.id, position });
    }
  );

  socket.on("disconnect", async () => {
    onlineUsers[socket.id].forEach(async (docId) => {
      try {
        const res = await saveObjsToDb(docId, socket);
        if (res) {
          socket.to(docId).emit("updation:succeeded", docId);
          if (!getSocketIdsInRoom(docId).length) {
            await client.del(`room:${docId}`);
            console.log("deleted on disconnect");
          }
        }
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
