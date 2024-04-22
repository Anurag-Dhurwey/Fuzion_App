import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
require("dotenv").config();
const host_emails: string[] = process.env.host_emails?.split("___") || [];
const only_admin_docs: string[] =
  process.env.only_admin_docs?.split("___") || [];

export const socket_middleware = async (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  next: (err?: ExtendedError | undefined) => void
) => {
  if (
    socket.handshake.query.email &&
    typeof socket.handshake.query.email == "string" &&
    socket.handshake.query.id &&
    typeof socket.handshake.query.id == "string" &&
    !only_admin_docs.includes(socket.handshake.query.id)
  ) {
    next();
  } else if (
    socket.handshake.query.email &&
    typeof socket.handshake.query.email == "string" &&
    socket.handshake.query.id &&
    typeof socket.handshake.query.id == "string" &&
    host_emails?.length &&
    only_admin_docs?.length &&
    only_admin_docs.includes(socket.handshake.query.id) &&
    host_emails.includes(socket.handshake.query.email)
  ) {
    next();
  } else if (!host_emails?.length) {
    next(new Error("host_emails did not found in environment"));
  } else if (!only_admin_docs?.length) {
    next(new Error("only_admin_docs did not found in environment"));
  } else {
    next(new Error("invalid request"));
  }
};
