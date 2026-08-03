import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./Components/ProtectedRoute";

import DashboardPage from "./Pages/DashboardPage";
import DepartmentsPage from "./Pages/DepartmentsPage";
import { EmployeesPage } from "./Pages/EmployeesPage";
import EmployeeProfilePage from "./Pages/EmployeeProfilePage";
import LoginPage from "./Pages/LoginPage";
import { ProjectsPage } from "./Pages/ProjectsPage";
import CreateUserPage from "./Pages/CreateUserPage";
import SuperAdminDashboardPage from "./Pages/SuperAdminDashboardPage";
import { SuperAdminLayout } from "./Pages/SuperAdminLayout";
import TeamLeadDashboardPage from "./Pages/TeamLeadDashboardPage";
import { TeamLeadLayout } from "./Pages/TeamLeadLayout";

import type {
  StoredUser,
  UserRole,
} from "./Types/auth";

export default function App(): React.ReactElement {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "Employee",
            ]}
          />
        }
      >
        <Route
          path="/employee/dashboard"
          element={
            <DashboardPage />
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "TeamLead",
            ]}
          />
        }
      >
        <Route
          path="/team-lead"
          element={
            <TeamLeadLayout />
          }
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <TeamLeadDashboardPage />
            }
          />

          <Route
            path="employees"
            element={
              <EmployeesPage />
            }
          />

          <Route
            path="projects"
            element={
              <ProjectsPage />
            }
          />

          <Route
            path="profile"
            element={
              <EmployeeProfilePage />
            }
          />
        </Route>
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "SuperAdmin",
            ]}
          />
        }
      >
        <Route
          path="/super-admin"
          element={
            <SuperAdminLayout />
          }
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <SuperAdminDashboardPage />
            }
          />

          <Route
            path="employees"
            element={
              <EmployeesPage />
            }
          />

          <Route
            path="departments"
            element={
              <DepartmentsPage />
            }
          />

          <Route
            path="projects"
            element={
              <ProjectsPage />
            }
          />

          <Route
            path="users/create"
            element={
              <CreateUserPage />
            }
          />
        </Route>
      </Route>

      <Route
        path="/dashboard"
        element={
          <DashboardRedirect />
        }
      />

      <Route
        path="/"
        element={
          <RootRedirect />
        }
      />

      <Route
        path="*"
        element={
          <RootRedirect />
        }
      />
    </Routes>
  );
}

function RootRedirect():
  React.ReactElement {
  const token: string | null =
    localStorage.getItem(
      "authToken",
    );

  const storedUser:
    | string
    | null =
    localStorage.getItem(
      "authUser",
    );

  return (
    <Navigate
      to={
        token && storedUser
          ? "/dashboard"
          : "/login"
      }
      replace
    />
  );
}

function DashboardRedirect():
  React.ReactElement {
  const token: string | null =
    localStorage.getItem(
      "authToken",
    );

  const storedUserJson:
    | string
    | null =
    localStorage.getItem(
      "authUser",
    );

  if (
    !token ||
    !storedUserJson
  ) {
    clearAuthentication();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const user =
      JSON.parse(
        storedUserJson,
      ) as StoredUser;

    if (
      !isUserRole(
        user.role,
      ) ||
      isTokenExpired(
        user.expiresAtUtc,
      )
    ) {
      clearAuthentication();

      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }

    return (
      <Navigate
        to={getDashboardPath(
          user.role,
        )}
        replace
      />
    );
  } catch {
    clearAuthentication();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }
}

function getDashboardPath(
  role: UserRole,
): string {
  switch (role) {
    case "Employee":
      return "/employee/dashboard";

    case "TeamLead":
      return "/team-lead/dashboard";

    case "SuperAdmin":
      return "/super-admin/dashboard";
  }
}

function isUserRole(
  role: unknown,
): role is UserRole {
  return (
    role === "SuperAdmin" ||
    role === "TeamLead" ||
    role === "Employee"
  );
}

function isTokenExpired(
  expiresAtUtc: string,
): boolean {
  if (!expiresAtUtc) {
    return false;
  }

  const expirationTime: number =
    new Date(
      expiresAtUtc,
    ).getTime();

  if (
    Number.isNaN(
      expirationTime,
    )
  ) {
    return true;
  }

  return (
    expirationTime <=
    Date.now()
  );
}

function clearAuthentication():
  void {
  localStorage.removeItem(
    "authToken",
  );

  localStorage.removeItem(
    "authUser",
  );
}