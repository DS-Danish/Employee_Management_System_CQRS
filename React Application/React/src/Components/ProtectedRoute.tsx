import {
  Navigate,
  Outlet,
} from "react-router-dom";

import type {
  StoredUser,
  UserRole,
} from "../Types/auth";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export default function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps): React.ReactElement {
  const token =
    localStorage.getItem(TOKEN_KEY);

  const storedUserJson =
    localStorage.getItem(USER_KEY);

  if (!token || !storedUserJson) {
    clearAuthentication();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  let currentUser: StoredUser;

  try {
    currentUser =
      JSON.parse(
        storedUserJson,
      ) as StoredUser;
  } catch {
    clearAuthentication();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    !isUserRole(currentUser.role) ||
    isTokenExpired(currentUser.expiresAtUtc)
  ) {
    clearAuthentication();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(currentUser.role)
  ) {
    return (
      <Navigate
        to={getDashboardPath(
          currentUser.role,
        )}
        replace
      />
    );
  }

  return <Outlet />;
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

  const expirationTime =
    new Date(expiresAtUtc).getTime();

  if (Number.isNaN(expirationTime)) {
    return true;
  }

  return expirationTime <= Date.now();
}

function clearAuthentication(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}