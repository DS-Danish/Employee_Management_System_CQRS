import { Navigate, useNavigate } from "react-router-dom";

interface StoredUser {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  departmentId: string | null;
  employeeId: string | null;
  expiresAtUtc: string;
}

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export default function DashboardPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  let currentUser: StoredUser;

  try {
    currentUser = JSON.parse(storedUser) as StoredUser;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    navigate("/login", { replace: true });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          width: 500,
          background: "#fff",
          padding: 40,
          borderRadius: 10,
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}
      >
        <p
          style={{
            color: "#666",
            marginBottom: 10,
          }}
        >
          Employee Management System
        </p>

        <h1>Welcome, {currentUser.fullName}</h1>

        <p>
          <strong>Email:</strong> {currentUser.email}
        </p>

        <p>
          <strong>Role:</strong> {currentUser.role}
        </p>

        <p>
          <strong>User ID:</strong> {currentUser.userId}
        </p>

        <button
          onClick={handleLogout}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}