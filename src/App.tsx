import { useEffect, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

import AppRoutes from "./routes/AppRoutes";
import { store, type AppDispatch, type RootState } from "./store/store";
import { disconnectSocket, initSocket } from "./services/socket";
import { Loader2 } from "lucide-react";
import { refreshUser } from "./store/slices/adminAuthSlice";

/* =====================================================
    APP CONTENT
===================================================== */

const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Refs to track initialization and prevent duplicate calls
  const socketInitialized = useRef(false);
  const authChecked = useRef(false);

  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  /* =====================================================
      AUTH SESSION RESTORE (Refined)
      Prevents race conditions where background fetches hit 
      401s before the session is fully marked as 'ready'.
  ===================================================== */
  useEffect(() => {
    // 1. If we are already initialized (from login or a previous refresh), stop.
    if (isInitialized) {
      authChecked.current = true;
      return;
    }

    // 2. If we haven't checked the session yet, do it once.
    if (!authChecked.current) {
      authChecked.current = true;
      dispatch(refreshUser());
    }
  }, [dispatch, isInitialized]);

  /* =====================================================
      SOCKET MANAGEMENT
      Strictly synced with the user's presence.
  ===================================================== */
  useEffect(() => {
    if (user?._id) {
      if (!socketInitialized.current) {
        initSocket(user._id);
        socketInitialized.current = true;
      }
    } else {
      // If user logs out or session is lost, cleanup immediately
      disconnectSocket();
      socketInitialized.current = false;
    }
  }, [user?._id]);

  /* =====================================================
      INITIAL LOADING STATE
  ===================================================== */
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#060b13] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#c5a059]" size={40} />
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
          Initializing Secure Session...
        </p>
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
    </>
  );
};

/* =====================================================
    ROOT APP
===================================================== */

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "4px",
              background: "#1e293b",
              color: "#fff",
              fontSize: "12px",
              border: "1px solid #334155",
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
};

export default App;