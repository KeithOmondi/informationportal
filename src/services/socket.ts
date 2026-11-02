import { io, Socket } from "socket.io-client";
import { store } from "../store/store";
import { incrementUnread } from "../store/slices/notificationSlice";

/* ===================================================
    Types
=================================================== */
interface SocketMessage {
  _id: string;
  content?: string;
  senderName?: string;
  // Add other relevant message fields here
}

let socket: Socket | null = null;

/* ===================================================
    INITIALIZE SOCKET
=================================================== */

export const initSocket = (userId: string): Socket => {
  if (!socket) {
    console.log("🧠 initSocket called with:", userId);

    const rawUrl = (import.meta.env.VITE_API_URL as string) || "";

    // Clean up the URL to get the base domain for the socket connection
    const SOCKET_URL = rawUrl
      ? rawUrl.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "")
      : "http://localhost:8000";

    console.log("🌍 RAW API URL:", rawUrl);
    console.log("🔌 SOCKET URL:", SOCKET_URL);

    // SOCKET_URL ends in /api/v1/jconference, which the server reads as the conference channel.
    // The socket proves who it is with the same access token as the API calls.
    socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: (cb) => cb({ token: store.getState().auth.accessToken }),
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    /* ================= CONNECT ================= */

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
      console.log("📡 Emitting setup with:", userId);
      socket?.emit("setup", { _id: userId });
    });

    /* ================= NEW MESSAGE ================= */

    socket.on("message received", (message: SocketMessage) => {
      console.log("📩 New message received:", message);

      // Increment unread count in Redux
      store.dispatch(incrementUnread());

      // Trigger push notification if app is in background
      if (document.visibilityState === 'hidden' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('New Message', {
            body: message?.content || 'You have a new message',
            icon: '/icon/pwa-192.png',
            badge: '/icon/pwa-192.png',
            tag: 'new-message', // Prevents duplicate notifications
          });
        });
      }
    });

    /* ================= DISCONNECT ================= */

    socket.on("disconnect", (reason: string) => {
      console.log("🔌 Socket disconnected:", reason);
    });

    /* ================= RECONNECT ================= */

    socket.io.on("reconnect_attempt", (attempt: number) => {
      console.log("🔄 Reconnect attempt:", attempt);
    });

    /* ================= ERROR ================= */

    socket.on("connect_error", (err: Error) => {
      console.error("❌ Socket Connection Error:", err.message);
    });
  }

  return socket;
};

/* ===================================================
    GET EXISTING SOCKET
=================================================== */

export const getSocket = (): Socket | null => {
  return socket;
};

/* ===================================================
    DISCONNECT SOCKET
=================================================== */

export const disconnectSocket = (): void => {
  if (socket) {
    console.log("🔌 Manually disconnecting socket:", socket.id);
    socket.disconnect();
    socket = null;
  }
};