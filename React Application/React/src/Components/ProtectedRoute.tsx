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

  requiredPermissions?: string[];

  permissionMode?:
    | "all"
    | "any";
}

const TOKEN_KEY =
  "authToken";

const USER_KEY =
  "authUser";

export default function ProtectedRoute({
  allowedRoles,
  requiredPermissions,
  permissionMode = "all",
}: ProtectedRouteProps):
  React.ReactElement {
  const token =
    localStorage.getItem(
      TOKEN_KEY,
    );

  const storedUserJson =
    localStorage.getItem(
      USER_KEY,
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

  let currentUser:
    StoredUser;

  try {
    const parsedUser =
      JSON.parse(
        storedUserJson,
      ) as StoredUser;

    currentUser = {
      ...parsedUser,

      permissions:
        Array.isArray(
          parsedUser.permissions,
        )
          ? parsedUser.permissions
          : [],
    };
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
    !isUserRole(
      currentUser.role,
    ) ||
    isTokenExpired(
      currentUser.expiresAtUtc,
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

  /*
   * Role authorization.
   */
  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(
      currentUser.role,
    )
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

  /*
   * SuperAdmin has every application
   * permission automatically.
   */
  const isSuperAdmin =
    currentUser.role ===
    "SuperAdmin";

  if (
    !isSuperAdmin &&
    requiredPermissions &&
    requiredPermissions.length > 0
  ) {
    const userPermissions =
      currentUser.permissions ?? [];

    const hasRequiredPermission =
      permissionMode === "any"
        ? requiredPermissions.some(
            permission =>
              userPermissions.includes(
                permission,
              ),
          )
        : requiredPermissions.every(
            permission =>
              userPermissions.includes(
                permission,
              ),
          );

    if (
      !hasRequiredPermission
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
    TOKEN_KEY,
  );

  localStorage.removeItem(
    USER_KEY,
  );
}