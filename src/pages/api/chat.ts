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

            socket.on("message", (msg: {username: string, message: string}) => {
                if (!msg.username || !msg.message) {
                    return;
                }
                console.log("📩 Received message:", msg);
                io.emit("message", { 
                    username: msg.username, 
                    message: msg.message
                });
            });

            socket.on("user-connect", (msg: {username: string}) => {
                console.log("📡 Client connected:", msg);
                io.emit("message", {
                    username: "System",
                    message: `${msg.username} joined the chat!`,
                })
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