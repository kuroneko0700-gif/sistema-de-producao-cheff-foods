import { io } from "socket.io-client";

const socket = io("https://cheff-foods-backend-production.up.railway.app", {
  transports: ["websocket"]
});

export default socket;