import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import CloseIcon from "@mui/icons-material/Close";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material/Select";

import {
  getEmployeeById,
  updateEmployee,
} from "../services/employeeService";

import {
  assignEmployeeToProject,
  removeEmployeeFromProject,
} from "../services/employeeProjectService";

import type { Department } from "../Types/department";

import type {
  EditEmployeeFormValues,
  Employee,
  EmployeeByIdResponse,
  UpdateEmployeeRequest,
} from "../Types/employee";

import type { Project } from "../Types/project";

interface EditEmployeeModalProps {
  open: boolean;
  employee: Employee | null;
  departments: Department[];
  projects: Project[];
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

const initialValues: EditEmployeeFormValues = {
  firstName: "",
  lastName: "",
  email: "",

  street: "",
  city: "",
  country: "Pakistan",
  postalCode: "",

  departmentId: "",
  projectIds: [],
};

export function EditEmployeeModal({
  open,
  employee,
  departments,
  projects,
  onClose,
  onUpdated,
}: EditEmployeeModalProps) {
  const [values, setValues] =
    useState<EditEmployeeFormValues>(initialValues);

  const [originalProjectIds, setOriginalProjectIds] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState<boolean>(false);

  const [submitting, setSubmitting] =
    useState<boolean>(false);

  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!open || !employee) {
      return;
    }

    const selectedEmployee: Employee = employee;

    async function loadEmployee(): Promise<void> {
      setLoading(true);
      setError("");

      try {
        const response: EmployeeByIdResponse =
          await getEmployeeById(selectedEmployee.id);

        const assignedProjectIds: string[] =
          selectedEmployee.projects?.map(
            (project: Project): string => project.id,
          ) ?? [];

        setOriginalProjectIds(assignedProjectIds);

        setValues({
          firstName: response.firstName ?? "",
          lastName: response.lastName ?? "",
          email: response.email ?? "",

          street: response.street ?? "",
          city: response.city ?? "",
          country: response.country ?? "Pakistan",
          postalCode: response.postalCode ?? "",

          departmentId:
            response.departmentId ?? "",

          projectIds: assignedProjectIds,
        });
      } catch (caughtError: unknown) {
        const message: string =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load employee information.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadEmployee();
  }, [open, employee]);

  function updateField<
    K extends keyof EditEmployeeFormValues,
  >(
    field: K,
    value: EditEmployeeFormValues[K],
  ): void {
    setValues(
      (
        currentValues: EditEmployeeFormValues,
      ): EditEmployeeFormValues => ({
        ...currentValues,
        [field]: value,
      }),
    );
  }

  function handleProjectChange(
    event: SelectChangeEvent<string[]>,
  ): void {
    const selectedValue = event.target.value;

    updateField(
      "projectIds",
      typeof selectedValue === "string"
        ? selectedValue.split(",")
        : selectedValue,
    );
  }

  function validateForm(): string | null {
    if (!values.firstName.trim()) {
      return "First name is required.";
    }

    if (!values.lastName.trim()) {
      return "Last name is required.";
    }

    if (!values.email.trim()) {
      return "Email is required.";
    }

    if (!values.email.includes("@")) {
      return "Enter a valid email address.";
    }

    if (!values.street.trim()) {
      return "Street is required.";
    }

    if (!values.city.trim()) {
      return "City is required.";
    }

    if (!values.country.trim()) {
      return "Country is required.";
    }

    return null;
  }

  async function synchronizeProjects(
    employeeId: string,
  ): Promise<void> {
    const projectsToAdd: string[] =
      values.projectIds.filter(
        (projectId: string): boolean =>
          !originalProjectIds.includes(projectId),
      );

    const projectsToRemove: string[] =
      originalProjectIds.filter(
        (projectId: string): boolean =>
          !values.projectIds.includes(projectId),
      );

    await Promise.all([
      ...projectsToAdd.map(
        (projectId: string): Promise<void> =>
          assignEmployeeToProject(
            employeeId,
            projectId,
          ),
      ),

      ...projectsToRemove.map(
        (projectId: string): Promise<void> =>
          removeEmployeeFromProject(
            employeeId,
            projectId,
          ),
      ),
    ]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!employee || submitting) {
      return;
    }

    const validationError: string | null =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const request: UpdateEmployeeRequest = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),

        street: values.street.trim(),
        city: values.city.trim(),
        country: values.country.trim(),
        postalCode: values.postalCode.trim(),

        departmentId: values.departmentId || null,
      };

      await updateEmployee(employee.id, request);
      await synchronizeProjects(employee.id);
      await onUpdated();
    } catch (caughtError: unknown) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the employee.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(): void {
    if (submitting) {
      return;
    }

    setValues(initialValues);
    setOriginalProjectIds([]);
    setError("");

    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography component="span" variant="h6">
            Edit Employee
          </Typography>

          <IconButton
            disabled={submitting}
            onClick={handleClose}
            aria-label="Close edit employee dialog"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box
        component="form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <DialogContent dividers>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 6,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3}>
              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}

              <Typography
                component="h2"
                variant="subtitle1"
                sx={{ fontWeight: 600 }}
              >
                Basic Information
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  label="First Name"
                  required
                  value={values.firstName}
                  onChange={(event) =>
                    updateField(
                      "firstName",
                      event.target.value,
                    )
                  }
                />

                <TextField
                  label="Last Name"
                  required
                  value={values.lastName}
                  onChange={(event) =>
                    updateField(
                      "lastName",
                      event.target.value,
                    )
                  }
                />

                <TextField
                  label="Email"
                  required
                  type="email"
                  value={values.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value,
                    )
                  }
                />

                <FormControl>
                  <InputLabel id="edit-department-label">
                    Department
                  </InputLabel>

                  <Select
                    labelId="edit-department-label"
                    label="Department"
                    value={values.departmentId}
                    onChange={(event) =>
                      updateField(
                        "departmentId",
                        event.target.value,
                      )
                    }
                  >
                    <MenuItem value="">
                      <em>Not assigned</em>
                    </MenuItem>

                    {departments.map(
                      (department: Department) => (
                        <MenuItem
                          key={department.id}
                          value={department.id}
                        >
                          {department.name}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>

                <FormControl
                  sx={{
                    gridColumn: {
                      md: "1 / -1",
                    },
                  }}
                >
                  <InputLabel id="edit-projects-label">
                    Projects
                  </InputLabel>

                  <Select<string[]>
                    labelId="edit-projects-label"
                    multiple
                    value={values.projectIds}
                    onChange={handleProjectChange}
                    input={
                      <OutlinedInput label="Projects" />
                    }
                    renderValue={(
                      selectedProjectIds: string[],
                    ): string =>
                      selectedProjectIds
                        .map(
                          (
                            projectId: string,
                          ): string =>
                            projects.find(
                              (
                                project: Project,
                              ): boolean =>
                                project.id === projectId,
                            )?.name ?? projectId,
                        )
                        .join(", ")
                    }
                  >
                    {projects.map(
                      (project: Project) => (
                        <MenuItem
                          key={project.id}
                          value={project.id}
                        >
                          <Checkbox
                            checked={values.projectIds.includes(
                              project.id,
                            )}
                          />

                          <ListItemText
                            primary={project.name}
                          />
                        </MenuItem>
                      ),
                    )}
                  </Select>

                  <FormHelperText>
                    Multiple projects can be selected.
                  </FormHelperText>
                </FormControl>
              </Box>

              <Typography
                component="h2"
                variant="subtitle1"
                sx={{ fontWeight: 600 }}
              >
                Address
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  label="Street"
                  required
                  value={values.street}
                  onChange={(event) =>
                    updateField(
                      "street",
                      event.target.value,
                    )
                  }
                />

                <TextField
                  label="City"
                  required
                  value={values.city}
                  onChange={(event) =>
                    updateField(
                      "city",
                      event.target.value,
                    )
                  }
                />

                <TextField
                  label="Country"
                  required
                  value={values.country}
                  onChange={(event) =>
                    updateField(
                      "country",
                      event.target.value,
                    )
                  }
                />

                <TextField
                  label="Postal Code"
                  value={values.postalCode}
                  onChange={(event) =>
                    updateField(
                      "postalCode",
                      event.target.value,
                    )
                  }
                />
              </Box>

              <Alert severity="info">
                Employee-detail fields require a separate
                backend update endpoint.
              </Alert>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            type="button"
            disabled={submitting}
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={
              loading ||
              submitting ||
              employee === null
            }
            startIcon={
              submitting ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : undefined
            }
          >
            {submitting
              ? "Saving..."
              : "Save Changes"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}