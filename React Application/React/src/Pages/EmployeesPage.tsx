import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import AddIcon from "@mui/icons-material/Add";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupsIcon from "@mui/icons-material/Groups";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
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
  Skeleton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  alpha,
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

import type {
  StoredUser,
} from "../Types/auth";

// Each stat gets its own accent so the row scans as three distinct
// signals rather than three repeats of the theme's primary color.
type StatAccent = "indigo" | "violet" | "teal";

const STAT_ACCENTS: Record<
  StatAccent,
  { main: string; soft: string }
> = {
  indigo: { main: "#4F46E5", soft: "#EEF0FD" },
  violet: { main: "#7C3AED", soft: "#F3EDFD" },
  teal: { main: "#0D9488", soft: "#E6F5F3" },
};

interface SummaryStatProps {
  icon: ReactNode;
  label: string;
  value: number;
  loading: boolean;
  accent: StatAccent;
}

function SummaryStat({
  icon,
  label,
  value,
  loading,
  accent,
}: SummaryStatProps) {
  const { main, soft } = STAT_ACCENTS[accent];

  return (
    <Paper
      elevation={0}
      sx={{
        px: 2.75,
        py: 2.25,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: 2.5,
        flex: 1,
        minWidth: 200,
        border: "1px solid",
        borderColor: "divider",
        transition:
          "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
        "&:hover": {
          borderColor: alpha(main, 0.35),
          boxShadow: `0 4px 16px ${alpha(main, 0.12)}`,
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: soft,
          color: main,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        {loading ? (
          <Skeleton width={40} height={32} />
        ) : (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: -0.5,
            }}
          >
            {value}
          </Typography>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
        >
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

export function EmployeesPage() {
  const currentUser =
    getStoredUser();

  const canDeleteEmployees =
    currentUser?.role === "SuperAdmin";

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
    <Box sx={{ bgcolor: "#FAFAFA", minHeight: "100%" }}>
      <Container maxWidth="xl" sx={{ py: 5 }}>
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, #FFFFFF 0%, #F7F7FB 100%)",
            }}
          >
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
                  sx={{
                    fontWeight: 700,
                    letterSpacing: -0.6,
                  }}
                >
                  Employee Management
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Manage employees, departments and project
                  assignments in one place.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Tooltip title="Refresh">
                  <span>
                    <IconButton
                      aria-label="Refresh employees"
                      disabled={loading}
                      onClick={() => void loadData()}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>

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
              </Stack>
            </Box>
          </Paper>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <SummaryStat
              icon={<PeopleAltIcon />}
              label="Employees"
              value={employees.length}
              loading={loading}
              accent="indigo"
            />

            <SummaryStat
              icon={<ApartmentIcon />}
              label="Departments"
              value={departments.length}
              loading={loading}
              accent="violet"
            />

            <SummaryStat
              icon={<GroupsIcon />}
              label="Active projects"
              value={projects.length}
              loading={loading}
              accent="teal"
            />
          </Stack>

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
                borderRadius: 3,
                borderStyle: "dashed",
                bgcolor: "background.paper",
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  bgcolor: STAT_ACCENTS.indigo.soft,
                  color: STAT_ACCENTS.indigo.main,
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
                Add your first employee to start assigning
                departments and projects.
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
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
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
                borderRadius: 2,
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

          {canDeleteEmployees && (
            <>
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
            </>
          )}
        </Menu>

        {canDeleteEmployees && (
          <Dialog
            open={Boolean(pendingDeletion)}
            onClose={handleCancelDelete}
            maxWidth="xs"
            fullWidth
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
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
        )}

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

function getStoredUser(): StoredUser | null {
  const storedUserJson =
    localStorage.getItem("authUser");

  if (!storedUserJson) {
    return null;
  }

  try {
    return JSON.parse(
      storedUserJson,
    ) as StoredUser;
  } catch {
    return null;
  }
}