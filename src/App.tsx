import { useEffect, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

import AppRoutes from "./routes/AppRoutes";
import { store, type AppDispatch, type RootState } from "./store/store";
import { disconnectSocket, initSocket } from "./services/socket";
import { Loader2 } from "lucide-react";
import { refreshUser } from "./store/slices/adminAuthSlice";
import InstallButton from "./components/InstallButton";

/* =====================================================
    APP CONTENT
===================================================== */

const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const socketInitialized = useRef(false);

  const { user, isInitialized, loading } = useSelector(
    (state: RootState) => state.auth
  );

  // ✅ Fire once on mount — no refs, no conditions
  useEffect(() => {
    dispatch(refreshUser());
  }, [dispatch]);

  // ✅ Socket lifecycle tied to user identity
  useEffect(() => {
    if (user?._id) {
      if (!socketInitialized.current) {
        initSocket(user._id);
        socketInitialized.current = true;
      }
    } else {
      disconnectSocket();
      socketInitialized.current = false;
    }
  }, [user?._id]);

  // ✅ Block ALL route rendering until refresh resolves
  if (!isInitialized || loading) {
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
      <InstallButton />
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