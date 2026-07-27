import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import type {
  LoginResponse,
} from "../Types/auth";

export default function DashboardPage() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("accessToken");

  const storedUser =
    localStorage.getItem("currentUser");

  if (!token || !storedUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  let currentUser: LoginResponse;

  try {
    currentUser =
      JSON.parse(storedUser) as LoginResponse;
  } catch {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");

    navigate("/login");
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div>
          <p className="auth-eyebrow">
            Employee Management System
          </p>

          <h1>
            Welcome, {currentUser.fullName}
          </h1>

          <p>
            You are signed in as{" "}
            <strong>{currentUser.role}</strong>.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </section>
    </main>
  );
}