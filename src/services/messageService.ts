import axios, { AxiosError } from "axios";
import { getSocket } from "./socket";

const API_URL = import.meta.env.VITE_API_URL;

/* =====================================
    Types
===================================== */
export interface IMessage {
  _id: string;
  sender: string;
  receiver?: string;
  group?: string;
  text?: string;
  fileUrl?: string;
  createdAt: string;
  // Add other fields based on your backend schema
}

interface SendMessagePayload {
  receiver?: string;
  group?: string;
  text?: string;
  file?: File;
}

/* =====================================
    API Calls
===================================== */

export const sendMessageAPI = async (payload: SendMessagePayload): Promise<IMessage> => {
  const formData = new FormData();

  if (payload.receiver) formData.append("receiver", payload.receiver);
  if (payload.group) formData.append("group", payload.group);
  if (payload.text) formData.append("text", payload.text);
  if (payload.file) formData.append("file", payload.file);

  try {
    const { data } = await axios.post<{ message: IMessage }>(
      `${API_URL}/messages`, 
      formData, 
      {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      }
    );

    return data.message;
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      throw new Error(err.response?.data?.message || "Failed to send message");
    }
    throw new Error("An unexpected error occurred");
  }
};

/* =====================================
    Socket Listener
===================================== */

export const onMessageReceived = (callback: (message: IMessage) => void): void => {
  const socket = getSocket();

  if (!socket) {
    console.warn("⚠️ Socket not initialized yet");
    return;
  }

  console.log("👂 Listening for message:new on socket:", socket.id);

  // Prevent duplicate listeners
  socket.off("message:new"); 
  
  socket.on("message:new", (msg: IMessage) => {
    console.log("📩 message:new received:", msg);
    callback(msg);
  });
};