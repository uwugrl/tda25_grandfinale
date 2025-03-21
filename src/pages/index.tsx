import { Button, Input, Modal, ModalClose, ModalDialog, Typography } from "@mui/joy";
import { PrismaClient } from "@prisma/client";
import { InferGetServerSidePropsType } from "next";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const prisma = new PrismaClient();

export async function getServerSideProps() {
  
  const messages = (await prisma.messages.findMany()).map(x => ({username: x.username, message: x.message}));
  return {
    props: {
      messages
    }
  }
}

export default function SocketComponent(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<{username: string, message: string}[]>(props.messages); 
  const [input, setInput] = useState("");

  const [username, setUsername] = useState("");
  const [showUsernameDialog, setShowUsernameDialog] = useState(true);

  useEffect(() => {
    console.log("🔄 Initializing WebSocket connection...");

    const getWebSocketURL = () => {
      if (typeof window === "undefined") return ""; // Ensure SSR safety
      return `${window.location.protocol}//${window.location.host}`;
    };

    console.log("🔗 WebSocket URL:", getWebSocketURL());

    const newSocket = io(getWebSocketURL(), {
      path: "/api/chat",
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to WebSocket server:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err.message);
    });

    newSocket.on("message", (msg: { username: string, message: string }) => {
      console.log("📩 Received message:", msg);
      setMessages((prev) => [...prev, msg]);
      window.scrollTo(0, document.body.scrollHeight);
    });

    setSocket(newSocket);

    return () => {
      console.log("🔌 Disconnecting WebSocket...");
      newSocket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (input) {
      console.log("Sending message:", input);
      socket?.emit("message", {
        username,
        message: input
      });
      setInput("");
    }
  };

  return (
    <div className="w-2/3 m-auto">
      <Typography level="h1" fontSize={48}>Chat</Typography>
      <div className="fixed bottom-2 w-2/3 flex flex-row">

        <Input onKeyDown={(x) => {
          if (x.key === "Enter") {
            sendMessage();
          }
        }} className="border-3 rounded-lg w-full" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Chatuj..." />
        <Button onClick={sendMessage} className="p-1 border-2 m-2 rounded-lg">Send</Button> 
      </div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <Typography level="h2">{msg.username}</Typography>
            <Typography sx={{
              borderLeft: '1em'
            }}>{msg.message}</Typography>
          </div>
        ))}
      </div>
      <br /><br /><br /><br /><br />
      <br /><br />

      <Modal open={showUsernameDialog} onClose={() => setShowUsernameDialog(false)}>
        <ModalDialog>
          <ModalClose/>

          <Typography level="h2">Enter your username</Typography>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          <Button onClick={() => {
            socket?.emit("user-connect", {
              username
            });
            setShowUsernameDialog(false);
          }}>Send</Button>
        </ModalDialog>
      </Modal>
    </div>
  );
}
