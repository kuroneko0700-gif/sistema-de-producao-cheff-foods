import { io } from "socket.io-client";

const socket = io("https://cheff-foods-backend-production.up.railway.app");

export default socket;