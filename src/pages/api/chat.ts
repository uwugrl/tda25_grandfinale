import { NextApiResponseServerIO } from "@/types/socket";
import { NextApiRequest } from "next";
import { Server } from "socket.io";

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) { 
    if (!res.socket.server.io) {
      console.log("🔌 Initializing WebSocket server on /ap/chat...");
  
      const io = new Server(res.socket.server as any, {
        path: "/api/chat",
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      });
  
      io.on("connection", (socket) => {
        console.log("✅ Client connected:", socket.id);
  
        socket.on("message", (msg) => {
          console.log("📩 Received message:", msg);
          io.emit("message", msg);
        });
  
        socket.on("disconnect", () => {
          console.log("❌ Client disconnected:", socket.id);
        });
      });
  
      res.socket.server.io = io;
    } else {
      console.log("⚡ WebSocket server already running.");
    }
  
    res.end();
  }