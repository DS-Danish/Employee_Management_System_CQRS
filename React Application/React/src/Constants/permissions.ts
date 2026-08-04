// src/Constants/permissions.ts

export const AppPermissions = {
  ViewEmployees:
    "employees.view",

  ManageEmployees:
    "employees.manage",

  DeleteEmployees:
    "employees.delete",

  ViewDepartments:
    "departments.view",

  ManageDepartments:
    "departments.manage",

  ViewProjects:
    "projects.view",

  ManageProjects:
    "projects.manage",
} as const;

export type AppPermission =
  (typeof AppPermissions)[keyof typeof AppPermissions];

export const EmployeePermissions: AppPermission[] = [
  AppPermissions.ViewEmployees,
  AppPermissions.ManageEmployees,
  AppPermissions.DeleteEmployees,
];

export const DepartmentPermissions: AppPermission[] = [
  AppPermissions.ViewDepartments,
  AppPermissions.ManageDepartments,
];

export const ProjectPermissions: AppPermission[] = [
  AppPermissions.ViewProjects,
  AppPermissions.ManageProjects,
];

export const AllPermissions: AppPermission[] = [
  ...EmployeePermissions,
  ...DepartmentPermissions,
  ...ProjectPermissions,
];