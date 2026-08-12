import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupsIcon from "@mui/icons-material/Groups";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { CreateEmployeeModal } from "../Components/CreateEmployeeModal";
import { EditEmployeeModal } from "../Components/EditEmployeeModal";
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


export function EmployeesPage(): React.ReactElement {

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [createModalOpen, setCreateModalOpen] =
    useState<boolean>(false);

  const [editModalOpen, setEditModalOpen] =
    useState<boolean>(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [menuAnchorElement, setMenuAnchorElement] =
    useState<HTMLElement | null>(null);

  const [deletingEmployeeId, setDeletingEmployeeId] =
    useState<string | null>(null);

  const [pendingDeletion, setPendingDeletion] =
    useState<Employee | null>(null);

  const [error, setError] = useState<string>("");

  const [successMessage, setSuccessMessage] =
    useState<string>("");

  const loadEmployeeRelations = useCallback(
    async (
      employee: Employee,
      allDepartments: Department[],
      allProjects: Project[],
    ): Promise<Employee> => {
      const [projectResult, detailResult] =
        await Promise.allSettled([
          getEmployeeProjects(employee.id),

          employee.employeeDetail
            ? Promise.resolve(employee.employeeDetail)
            : getEmployeeDetail(employee.id),
        ]);

      const employeeProjects: EmployeeProject[] =
        projectResult.status === "fulfilled"
          ? projectResult.value
          : [];

      const employeeDetail: EmployeeDetail | null =
        detailResult.status === "fulfilled"
          ? detailResult.value
          : employee.employeeDetail ?? null;

      const assignedProjects: Project[] =
        employeeProjects
          .map(
            (
              assignment: EmployeeProject,
            ): Project | undefined =>
              allProjects.find(
                (project: Project): boolean =>
                  project.id === assignment.projectId,
              ),
          )
          .filter(
            (
              project: Project | undefined,
            ): project is Project =>
              project !== undefined,
          );

      const matchedDepartment:
        | Department
        | undefined = allDepartments.find(
        (department: Department): boolean =>
          department.id === employee.departmentId,
      );

      return {
        ...employee,

        department:
          employee.department ??
          matchedDepartment ??
          null,

        departmentName:
          employee.departmentName ??
          matchedDepartment?.name ??
          null,

        projects: assignedProjects,

        employeeDetail,
      };
    },
    [],
  );

  const loadData = useCallback(
    async (): Promise<void> => {
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
              (employee: Employee) =>
                loadEmployeeRelations(
                  employee,
                  departmentResponse,
                  projectResponse,
                ),
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
    },
    [loadEmployeeRelations],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function handleMenuOpen(
    event: MouseEvent<HTMLButtonElement>,
    employee: Employee,
  ): void {
    setMenuAnchorElement(event.currentTarget);
    setSelectedEmployee(employee);
  }

  function handleMenuClose(): void {
    setMenuAnchorElement(null);
  }

  function handleEditOpen(): void {
    if (!selectedEmployee) {
      return;
    }

    setMenuAnchorElement(null);
    setEditModalOpen(true);
  }

  function handleEditClose(): void {
    setEditModalOpen(false);
    setSelectedEmployee(null);
  }

  async function handleEmployeeCreated(): Promise<void> {
    setCreateModalOpen(false);
    setSuccessMessage(
      "Employee created successfully.",
    );

    await loadData();
  }

  async function handleEmployeeUpdated(): Promise<void> {
    setEditModalOpen(false);
    setSelectedEmployee(null);

    setSuccessMessage(
      "Employee updated successfully.",
    );

    await loadData();
  }

  function handleMenuDelete(): void {
    if (!selectedEmployee) {
      return;
    }

    setPendingDeletion(selectedEmployee);
    setMenuAnchorElement(null);
  }

  function handleCancelDelete(): void {
    if (deletingEmployeeId) {
      return;
    }

    setPendingDeletion(null);
    setSelectedEmployee(null);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!pendingDeletion || deletingEmployeeId) {
      return;
    }

    const employeeToDelete: Employee =
      pendingDeletion;

    setDeletingEmployeeId(employeeToDelete.id);
    setError("");

    try {
      await deleteEmployee(employeeToDelete.id);

      setPendingDeletion(null);
      setSelectedEmployee(null);

      setSuccessMessage(
        "Employee deleted successfully.",
      );

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

  const pendingDeletionName: string = useMemo(
    () =>
      pendingDeletion
        ? pendingDeletion.fullName?.trim() ||
          pendingDeletion.email
        : "",
    [pendingDeletion],
  );

  const isDeletingPendingEmployee: boolean =
    Boolean(
      pendingDeletion &&
        deletingEmployeeId === pendingDeletion.id,
    );

  return (
    <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100%" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              background: "linear-gradient(135deg, #1976d2 0%, #512da8 100%)",
              color: "common.white",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ opacity: 0.8, letterSpacing: 1.5 }}
                >
                  Employee Management
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Manage Employees
                </Typography>

                <Typography sx={{ mt: 1, opacity: 0.9 }}>
                  View, add, edit and manage employee information.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                  onClick={() => void loadData()}
                  sx={{
                    color: "common.white",
                    borderColor: "rgba(255,255,255,0.6)",
                    "&:hover": {
                      borderColor: "common.white",
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  Refresh
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  disableElevation
                  startIcon={<AddIcon />}
                  onClick={() => setCreateModalOpen(true)}
                  sx={{
                    bgcolor: "common.white",
                    color: "primary.main",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.92)" },
                  }}
                >
                  Add Employee
                </Button>
              </Stack>
            </Box>
          </Paper>

          {error && (
            <Alert
              severity="error"
              onClose={() => setError("")}
              sx={{ borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          {!loading && employees.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                py: 8,
                px: 3,
                textAlign: "center",
                borderRadius: 4,
                borderStyle: "dashed",
                borderColor: "#CBD5E1",
                bgcolor: "background.paper",
                boxShadow: "0 6px 20px rgba(15, 23, 42, 0.03)",
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "#EEF2FF",
                  color: "#4F46E5",
                }}
              >
                <GroupsIcon sx={{ fontSize: 32 }} />
              </Avatar>

              <Typography
                variant="h6"
                sx={{ fontWeight: 600 }}
              >
                No employees yet
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 420, mx: "auto" }}
              >
                Add your first employee to start managing
                employee records.
              </Typography>
              <Button
                  type="button"
                  variant="contained"
                  disableElevation
                  startIcon={<AddIcon />}
                  onClick={() =>
                    setCreateModalOpen(true)
                  }
                  sx={{ borderRadius: 2, px: 2.5 }}
                >
                  Add employee
                </Button>
            </Paper>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                borderColor: "#E2E8F0",
                bgcolor: "background.paper",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
              }}
            >
              <Box
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2.25,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                }}
              >
                <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: "#0F172A" }}
                >
                  All Employees
                </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Employee information currently available in the system.
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    px: 1.5,
                    py: 0.65,
                    borderRadius: 999,
                    bgcolor: "#EEF2FF",
                    color: "#4F46E5",
                    fontWeight: 700,
                  }}
                >
                  {employees.length} {employees.length === 1 ? "employee" : "employees"}
                </Typography>
              </Box>

              <EmployeeTable
                employees={employees}
                loading={loading}
                deletingEmployeeId={deletingEmployeeId}
                renderActions={(employee: Employee) => (
                        <Tooltip title="Employee actions">
                          <span>
                            <IconButton
                              aria-label={`Actions for ${
                                employee.fullName ||
                                employee.email
                              }`}
                              disabled={
                                deletingEmployeeId ===
                                employee.id
                              }
                              onClick={(
                                event: MouseEvent<HTMLButtonElement>,
                              ) =>
                                handleMenuOpen(
                                  event,
                                  employee,
                                )
                              }
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
              />
            </Paper>
          )}
        </Stack>

        <Menu
          anchorEl={menuAnchorElement}
          open={Boolean(menuAnchorElement)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          slotProps={{
            paper: {
              sx: {
                borderRadius: 2.5,
                minWidth: 180,
              },
            },
          }}
        >
          <MenuItem onClick={handleEditOpen}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>

              <ListItemText>
                Edit employee
              </ListItemText>
            </MenuItem>
          <Divider />

              <MenuItem
                disabled={
                  selectedEmployee !== null &&
                  deletingEmployeeId === selectedEmployee.id
                }
                onClick={handleMenuDelete}
                sx={{ color: "error.main" }}
              >
                <ListItemIcon>
                  <DeleteIcon
                    fontSize="small"
                    color="error"
                  />
                </ListItemIcon>

                <ListItemText>
                  Delete employee
                </ListItemText>
              </MenuItem>
        </Menu>
        <Dialog
            open={Boolean(pendingDeletion)}
            onClose={handleCancelDelete}
            maxWidth="xs"
            fullWidth
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3.5,
                },
              },
            }}
          >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Delete employee?
          </DialogTitle>

          <DialogContent>
            <DialogContentText>
              {pendingDeletionName
                ? `${pendingDeletionName} will be permanently removed, along with their project assignments. This can't be undone.`
                : "This employee will be permanently removed. This can't be undone."}
            </DialogContentText>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              type="button"
              disabled={isDeletingPendingEmployee}
              onClick={handleCancelDelete}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              color="error"
              variant="contained"
              disableElevation
              disabled={isDeletingPendingEmployee}
              startIcon={
                isDeletingPendingEmployee ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : (
                  <DeleteIcon />
                )
              }
              onClick={() =>
                void handleConfirmDelete()
              }
              sx={{ borderRadius: 2 }}
            >
              {isDeletingPendingEmployee
                ? "Deleting..."
                : "Delete"}
            </Button>
          </DialogActions>
          </Dialog>

        <CreateEmployeeModal
              open={createModalOpen}
              departments={departments}
              projects={projects}
              onClose={() =>
                setCreateModalOpen(false)
              }
              onCreated={handleEmployeeCreated}
            />

            <EditEmployeeModal
              open={editModalOpen}
              employee={selectedEmployee}
              departments={departments}
              projects={projects}
              onClose={handleEditClose}
              onUpdated={handleEmployeeUpdated}
            />

        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage("")}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setSuccessMessage("")}
            sx={{ borderRadius: 2 }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}