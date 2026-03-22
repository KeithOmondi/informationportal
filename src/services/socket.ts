import { io, Socket } from "socket.io-client";
import { store } from "../store/store"; // 👈 added
import { incrementUnread } from "../store/slices/notificationSlice"; // 👈 added

let socket: Socket | null = null;

/* ===================================================
   INITIALIZE SOCKET
=================================================== */

export const initSocket = (userId: string): Socket => {
  if (!socket) {
    console.log("🧠 initSocket called with:", userId);

    const rawUrl = import.meta.env.VITE_API_URL as string;

    const SOCKET_URL = rawUrl
      ? rawUrl.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "")
      : "http://localhost:8000";

    console.log("🌍 RAW API URL:", rawUrl);
    console.log("🔌 SOCKET URL:", SOCKET_URL);

    socket = io(SOCKET_URL, {
      withCredentials: true,
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

    socket.on("message received", (message) => {
      console.log("📩 New message received:", message)

      // Increment unread count in Redux
      store.dispatch(incrementUnread())

      // Trigger push notification if app is in background
      if (document.visibilityState === 'hidden') {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('New Message', {
            body: message?.content || 'You have a new message',
            icon: '/icon/pwa-192.png',
            badge: '/icon/pwa-192.png',
            tag: 'new-message', // 👈 prevents duplicate notifications
          })
        })
      }
    })

    /* ================= DISCONNECT ================= */

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });

    /* ================= RECONNECT ================= */

    socket.io.on("reconnect_attempt", (attempt) => {
      console.log("🔄 Reconnect attempt:", attempt);
    });

    /* ================= ERROR ================= */

    socket.on("connect_error", (err: any) => {
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

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Manually disconnecting socket:", socket.id);
    socket.disconnect();
    socket = null;
  }
};