import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/types/socket";
import { Server as IOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { captureException } from "@sentry/nextjs";

const prisma = new PrismaClient();

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if (res.socket.server.io) {
        console.log("⚡ WebSocket server already running.");
        res.end();
        return;
    }

    console.log("🔌 Initializing WebSocket server on /api/chat...");

    const io = new IOServer(res.socket.server as any, {
        path: "/api/chat",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("✅ Client connected:", socket.id);

        socket.on("message", async (msg: { username: string; message: string }) => {
            if (!msg.username || !msg.message) {
                console.log("⚠️ Bad message:", msg);
                return;
            }

            console.log("📩 Received message:", msg);

            try {
                await prisma.messages.create({
                    data: {
                        username: msg.username,
                        message: msg.message,
                    },
                });
            } catch (e) {
                captureException(e);
            }

            io.emit("message", msg);
        });

        socket.on("user-connect", async (msg: { username: string }) => {
            console.log("📡 New user connected:", msg);

            if (!msg.username) {
                console.log("⚠️ Bad username:", msg);
                return;
            }

            try {
                await prisma.messages.create({
                    data: {
                        username: "System",
                        message: `${msg.username} joined the chat!`,
                    },
                });
            } catch (e) {
                captureException(e);
            }

            io.emit("message", {
                username: "System",
                message: `${msg.username} joined the chat!`,
            });
        });

        socket.on("disconnect", () => {
            console.log("❌ Client disconnected:", socket.id);
        });
    });

    res.socket.server.io = io;
    res.end();
}
