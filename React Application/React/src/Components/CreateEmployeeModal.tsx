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
  createEmployee,
  createEmployeeDetail,
} from "../services/employeeService";

import { assignEmployeeToProject } from "../services/employeeProjectService";

import type { Department } from "../Types/department";

import type {
  CreateEmployeeDetailRequest,
  CreateEmployeeFormValues,
  CreateEmployeeRequest,
} from "../Types/employee";

import type { Project } from "../Types/project";

interface CreateEmployeeModalProps {
  open: boolean;
  departments: Department[];
  projects: Project[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const initialValues: CreateEmployeeFormValues = {
  firstName: "",
  lastName: "",
  email: "",

  street: "",
  city: "",
  country: "Pakistan",
  postalCode: "",

  departmentId: "",
  projectIds: [],

  cnic: "",
  phoneNumber: "",
  dateOfBirth: "",
  gender: "",
};

export function CreateEmployeeModal({
  open,
  departments,
  projects,
  onClose,
  onCreated,
}: CreateEmployeeModalProps) {
  const [values, setValues] =
    useState<CreateEmployeeFormValues>(initialValues);

  const [submitting, setSubmitting] =
    useState<boolean>(false);

  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setError("");
    }
  }, [open]);

  function updateField<
    K extends keyof CreateEmployeeFormValues,
  >(
    field: K,
    value: CreateEmployeeFormValues[K],
  ): void {
    setValues(
      (
        currentValues: CreateEmployeeFormValues,
      ): CreateEmployeeFormValues => ({
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submitting) {
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
      const employeeRequest: CreateEmployeeRequest = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),

        street: values.street.trim(),
        city: values.city.trim(),
        country: values.country.trim(),
        postalCode: values.postalCode.trim(),

        departmentId: values.departmentId || null,
      };

      const employeeId: string =
        await createEmployee(employeeRequest);

      const hasEmployeeDetail: boolean = Boolean(
        values.cnic.trim() ||
          values.phoneNumber.trim() ||
          values.dateOfBirth ||
          values.gender,
      );

      if (hasEmployeeDetail) {
        const detailRequest: CreateEmployeeDetailRequest = {
          cnic: values.cnic.trim(),
          phoneNumber: values.phoneNumber.trim(),
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
        };

        await createEmployeeDetail(
          employeeId,
          detailRequest,
        );
      }

      await Promise.all(
        values.projectIds.map(
          (projectId: string): Promise<void> =>
            assignEmployeeToProject(
              employeeId,
              projectId,
            ),
        ),
      );

      await onCreated();
    } catch (caughtError: unknown) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Employee creation failed.";

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
            Add New Employee
          </Typography>

          <IconButton
            disabled={submitting}
            onClick={handleClose}
            aria-label="Close create employee dialog"
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
          <Stack spacing={3}>
            {error && (
              <Alert severity="error">{error}</Alert>
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
                <InputLabel id="create-department-label">
                  Department
                </InputLabel>

                <Select
                  labelId="create-department-label"
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
                <InputLabel id="create-projects-label">
                  Projects
                </InputLabel>

                <Select<string[]>
                  labelId="create-projects-label"
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
                        (projectId: string): string =>
                          projects.find(
                            (project: Project): boolean =>
                              project.id === projectId,
                          )?.name ?? projectId,
                      )
                      .join(", ")
                  }
                >
                  {projects.map((project: Project) => (
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
                  ))}
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
              Employee Details
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
                label="CNIC"
                placeholder="35202-1234567-1"
                value={values.cnic}
                onChange={(event) =>
                  updateField(
                    "cnic",
                    event.target.value,
                  )
                }
              />

              <TextField
                label="Phone Number"
                placeholder="03001234567"
                value={values.phoneNumber}
                onChange={(event) =>
                  updateField(
                    "phoneNumber",
                    event.target.value,
                  )
                }
              />

              <TextField
                label="Date of Birth"
                type="date"
                value={values.dateOfBirth}
                onChange={(event) =>
                  updateField(
                    "dateOfBirth",
                    event.target.value,
                  )
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                  htmlInput: {
                    max: new Date()
                      .toISOString()
                      .split("T")[0],
                  },
                }}
              />

              <FormControl>
                <InputLabel id="create-gender-label">
                  Gender
                </InputLabel>

                <Select
                  labelId="create-gender-label"
                  label="Gender"
                  value={values.gender}
                  onChange={(event) =>
                    updateField(
                      "gender",
                      event.target.value,
                    )
                  }
                >
                  <MenuItem value="">
                    <em>Select gender</em>
                  </MenuItem>

                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">
                    Female
                  </MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
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
          </Stack>
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
            disabled={submitting}
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
              ? "Creating..."
              : "Create Employee"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}