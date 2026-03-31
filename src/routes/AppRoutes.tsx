// AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";

// Admin Imports
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminMessages from "../pages/admin/AdminMessages";
import AdminLayout from "../components/admin/AdminLayout";

// Judge Imports
import JudgeDashboardPage from "../pages/judge/JudgeDashboard";
import JudgeLayout from "../components/judge/JudgeLayout";
import JudgeNoticesPages from "../pages/judge/JudgeNotices";
import JudgeEventsPage from "../pages/judge/JudgeEvents";
import CourtInformation from "../pages/judge/CourtInformation";
import AdminCourtInfo from "../pages/admin/AdminCourtInfo";
import AdminGuestList from "../pages/admin/AdminGuestList";
import AdminNoticesPage from "../pages/admin/AdminNoticesPage";
import AdminEventsPage from "../pages/admin/AdminEventsPage";
import JudgesReligion from "../pages/judge/JudgesReligion";
import AdminOath from "../pages/admin/AdminOath";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminGallery from "../pages/admin/AdminGallary";
import JudgeGallery from "../pages/judge/JudgesGallary";
import JudgeMessagePage from "../pages/judge/JudgeMessage";
import DrLayout from "../components/dr/DrLayout";
import DrDashboard from "../pages/dr/DrDashboard";
import DrPasswordSetup from "../components/Login/DrPasswordSetup";
import DrNotices from "../pages/dr/DrNotices";
import DrCinfo from "../pages/dr/DrCinfo";
import DrDocs from "../pages/dr/DrDocs";
import DrEvents from "../pages/dr/DrEvents";
import AdminProgram from "../pages/admin/AdminProgram";
import DrProgramme from "../pages/dr/DrProgramme";
import DrGallery from "../pages/dr/DrGallery";
import ForgotPassword from "../components/Login/ForgotPassword";
import ResetPassword from "../components/Login/ResetPassword";

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup-password" element={<DrPasswordSetup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* 2. ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout /> {/* Make sure AdminLayout has <Outlet /> */}
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="information" element={<AdminCourtInfo />} />
        <Route path="list" element={<AdminGuestList />} />
        <Route path="notice" element={<AdminNoticesPage />} />
        <Route path="event" element={<AdminEventsPage />} />
        <Route path="documents" element={<AdminOath />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="program" element={<AdminProgram />} />
        {/* Default redirect for /admin */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 3. JUDGE / USER ROUTES */}
      <Route
        path="/judge"
        element={
          <ProtectedRoute allowedRoles={["judge"]}>
            <JudgeLayout /> {/* Make sure JudgeLayout has <Outlet /> */}
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<JudgeDashboardPage />} />
        <Route path="information" element={<CourtInformation />} />
        {/* You can add more judge routes here like messages, notices, events, settings */}
        <Route path="messages" element={<JudgeMessagePage />} />
        <Route path="notices" element={<JudgeNoticesPages />} />
        <Route path="events" element={<JudgeEventsPage />} />
        <Route path="documents" element={<JudgesReligion />} />
        <Route path="gallery" element={<JudgeGallery />} />

        {/* Default redirect for /judge */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route
        path="/dr"
        element={
          <ProtectedRoute allowedRoles={["dr"]}>
            <DrLayout /> {/* Make sure JudgeLayout has <Outlet /> */}
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DrDashboard />} />
        <Route path="notice" element={<DrNotices />} />
        <Route path="information" element={<DrCinfo />} />
        <Route path="documents" element={<DrDocs />} />
        <Route path="events" element={<DrEvents />} />
        <Route path="programme" element={<DrProgramme />} />
        <Route path="gallery" element={<DrGallery />} />

        {/* Default redirect for /judge */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 4. ROOT & FALLBACK ROUTES */}
      <Route path="/" element={<Navigate to="/judge/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/judge/dashboard" replace />} />
    </Routes>
  );
}
