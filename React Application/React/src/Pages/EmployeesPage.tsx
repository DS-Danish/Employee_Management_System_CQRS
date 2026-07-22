import { useCallback, useEffect, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { CreateEmployeeModal } from "../Components/CreateEmployeeModal";
import { EmployeeTable } from "../Components/EmployeeTable";

import { getDepartments } from "../services/departmentService";
import {
  deleteEmployee,
  getEmployeeDetail,
  getEmployees,
} from "../services/employeeService";
import { getEmployeeProjects } from "../services/employeeProjectService";
import { getProjects } from "../services/projectService";

import type { Department } from "../Types/department";
import type {
  Employee,
  EmployeeDetail,
} from "../Types/employee";
import type {
  EmployeeProject,
  Project,
} from "../Types/project";

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [createModalOpen, setCreateModalOpen] =
    useState<boolean>(false);

  const [deletingEmployeeId, setDeletingEmployeeId] = useState<
    string | null
  >(null);

  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] =
    useState<string>("");

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const [
        employeeResponse,
        departmentResponse,
        projectResponse,
      ] = await Promise.all([
        getEmployees(),
        getDepartments(),
        getProjects(),
      ]);

      const employeesWithRelations: Employee[] =
        await Promise.all(
          employeeResponse.map(
            async (employee: Employee): Promise<Employee> => {
              const [
                employeeAssignments,
                employeeDetail,
              ] = await Promise.all([
                getEmployeeProjects(employee.id),
                employee.employeeDetail
                  ? Promise.resolve(employee.employeeDetail)
                  : getEmployeeDetail(employee.id),
              ]);

              const assignedProjects: Project[] =
                employeeAssignments
                  .map((assignment: EmployeeProject) =>
                    projectResponse.find(
                      (project: Project) =>
                        project.id === assignment.projectId,
                    ),
                  )
                  .filter(
                    (
                      project: Project | undefined,
                    ): project is Project =>
                      project !== undefined,
                  );

              const department: Department | undefined =
                departmentResponse.find(
                  (item: Department) =>
                    item.id === employee.departmentId,
                );

              return {
                ...employee,
                department:
                  employee.department ?? department ?? null,
                projects: assignedProjects,
                employeeDetail:
                  employeeDetail as EmployeeDetail | null,
              };
            },
          ),
        );

      setEmployees(employeesWithRelations);
      setDepartments(departmentResponse);
      setProjects(projectResponse);
    } catch (caughtError: unknown) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load employee information.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleEmployeeCreated(): Promise<void> {
    setCreateModalOpen(false);
    setSuccessMessage("Employee created successfully.");

    await loadData();
  }

  async function handleDelete(
    employee: Employee,
  ): Promise<void> {
    const employeeName: string =
      employee.fullName?.trim() || employee.email;

    const confirmed: boolean = window.confirm(
      `Delete ${employeeName}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingEmployeeId(employee.id);
    setError("");

    try {
      await deleteEmployee(employee.id);

      setSuccessMessage("Employee deleted successfully.");

      await loadData();
    } catch (caughtError: unknown) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete the employee.";

      setError(message);
    } finally {
      setDeletingEmployeeId(null);
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            alignItems: {
              xs: "stretch",
              sm: "center",
            },
            display: "flex",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              component="h1"
              variant="h4"
              sx={{ fontWeight: 700 }}
            >
              Employee Management
            </Typography>

            <Typography color="text.secondary">
              Manage employees, departments and project
              assignments.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <IconButton
              aria-label="Refresh employees"
              disabled={loading}
              onClick={() => void loadData()}
            >
              <RefreshIcon />
            </IconButton>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
            >
              Add Employee
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <EmployeeTable
          employees={employees}
          loading={loading}
          deletingEmployeeId={deletingEmployeeId}
          onDelete={handleDelete}
        />
      </Stack>

      <CreateEmployeeModal
        open={createModalOpen}
        departments={departments}
        projects={projects}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleEmployeeCreated}
      />

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage("")}
        message={successMessage}
      />
    </Container>
  );
}