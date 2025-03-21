import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  path: "/api/chat",
});

export default function SocketComponent() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    console.log("UseEffect called");
    socket.on("connect", () => {
      console.log("Connected to WebSocket server:", socket.id);
    });

    socket.on("message", (msg: string) => {
      console.log("Received message from server:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      console.log("Disconnecting from WebSocket server:", socket.id);
      socket.off("message");
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (input) {
      console.log("Sending message:", input);
      socket.emit("message", input);
      setInput("");
    }
  };

  return (
    <div>
      <h2 className="text-4xl m-16 text-center">Socket.io Chat</h2>
      <div className="text-center ">
        <input className="border-3 rounded-lg" value={input} onChange={(e) => setInput(e.target.value)} />
        <br />
        <button onClick={sendMessage} className="p-1 border-2 m-2 rounded-lg">Send</button>
      </div>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
    </div>
  );
}
