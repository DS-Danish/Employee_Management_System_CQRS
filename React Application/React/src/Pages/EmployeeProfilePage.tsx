import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import ApartmentIcon from "@mui/icons-material/Apartment";
import BadgeIcon from "@mui/icons-material/Badge";
import CancelIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SecurityIcon from "@mui/icons-material/Security";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  getMyEmployeeProfile,
  updateMyEmployeeProfile,
} from "../services/employeeService";

interface StoredUser {
  userId?: string;
  fullName?: string;
  email?: string;
  role?: string;
  departmentId?: string | null;
  employeeId?: string | null;
}

interface MyEmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;

  departmentId?: string | null;
  departmentName?: string | null;

  street?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

interface ProfileFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const EMPTY_FORM: ProfileFormValues = {
  firstName: "",
  lastName: "",
  street: "",
  city: "",
  country: "",
  postalCode: "",
};

function getStoredUser(): StoredUser {
  const storedUserJson: string | null =
    localStorage.getItem("authUser");

  if (!storedUserJson) {
    return {};
  }

  try {
    return JSON.parse(
      storedUserJson,
    ) as StoredUser;
  } catch {
    return {};
  }
}

function getInitials(
  firstName: string,
  lastName: string,
): string {
  const firstInitial: string =
    firstName.trim().charAt(0);

  const lastInitial: string =
    lastName.trim().charAt(0);

  const initials: string =
    `${firstInitial}${lastInitial}`.trim();

  return initials
    ? initials.toUpperCase()
    : "EP";
}

function formatRole(role?: string): string {
  if (!role) {
    return "Employee";
  }

  return role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("-", " ")
    .trim();
}

function ProfileField({
  icon,
  label,
  value,
}: ProfileFieldProps): React.ReactElement {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 2,
        borderRadius: 2,
        bgcolor: "#F8FAFC",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#EEF2FF",
          color: "#4F46E5",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mb: 0.25,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            overflowWrap: "anywhere",
          }}
        >
          {value || "Not available"}
        </Typography>
      </Box>
    </Box>
  );
}

export default function EmployeeProfilePage():
  React.ReactElement {
  const storedUser: StoredUser =
    useMemo(
      () => getStoredUser(),
      [],
    );

  const [profile, setProfile] =
    useState<MyEmployeeProfile | null>(
      null,
    );

  const [formValues, setFormValues] =
    useState<ProfileFormValues>(
      EMPTY_FORM,
    );

  const [loading, setLoading] =
    useState<boolean>(true);

  const [saving, setSaving] =
    useState<boolean>(false);

  const [editing, setEditing] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  const [successMessage, setSuccessMessage] =
    useState<string>("");

  const populateForm = useCallback(
    (
      employeeProfile: MyEmployeeProfile,
    ): void => {
      setFormValues({
        firstName:
          employeeProfile.firstName ?? "",

        lastName:
          employeeProfile.lastName ?? "",

        street:
          employeeProfile.street ?? "",

        city:
          employeeProfile.city ?? "",

        country:
          employeeProfile.country ?? "",

        postalCode:
          employeeProfile.postalCode ?? "",
      });
    },
    [],
  );

  const loadProfile =
    useCallback(async (): Promise<void> => {
      setLoading(true);
      setError("");

      try {
        const result: MyEmployeeProfile =
          await getMyEmployeeProfile();

        setProfile(result);
        populateForm(result);
      } catch (caughtError: unknown) {
        const message: string =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load your profile.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }, [populateForm]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const {
      name,
      value,
    } = event.target;

    setFormValues(
      (
        previousValues:
          ProfileFormValues,
      ) => ({
        ...previousValues,
        [name]: value,
      }),
    );
  }

  function handleStartEditing(): void {
    if (profile) {
      populateForm(profile);
    }

    setError("");
    setEditing(true);
  }

  function handleCancelEditing(): void {
    if (profile) {
      populateForm(profile);
    }

    setError("");
    setEditing(false);
  }

  const hasChanges: boolean = useMemo(() => {
    if (!profile) {
      return false;
    }

    return (
      formValues.firstName.trim() !== (profile.firstName ?? "").trim() ||
      formValues.lastName.trim() !== (profile.lastName ?? "").trim() ||
      formValues.street.trim() !== (profile.street ?? "").trim() ||
      formValues.city.trim() !== (profile.city ?? "").trim() ||
      formValues.country.trim() !== (profile.country ?? "").trim() ||
      formValues.postalCode.trim() !== (profile.postalCode ?? "").trim()
    );
  }, [formValues, profile]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (saving || !hasChanges) {
      return;
    }

    if (
      !formValues.firstName.trim() ||
      !formValues.lastName.trim()
    ) {
      setError(
        "First name and last name are required.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateMyEmployeeProfile({
        firstName:
          formValues.firstName.trim(),

        lastName:
          formValues.lastName.trim(),

        street:
          formValues.street.trim(),

        city:
          formValues.city.trim(),

        country:
          formValues.country.trim(),

        postalCode:
          formValues.postalCode.trim(),
      });

      await loadProfile();

      updateStoredUserName(
        formValues.firstName,
        formValues.lastName,
      );

      setEditing(false);
      setSuccessMessage(
        "Profile updated successfully.",
      );
    } catch (caughtError: unknown) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update your profile.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  const fullName: string =
    profile
      ? `${profile.firstName} ${profile.lastName}`.trim()
      : storedUser.fullName ??
        "Employee";

  const email: string =
    profile?.email ??
    storedUser.email ??
    "";

  const departmentName: string =
    profile?.departmentName ??
    "Not assigned";

  const employeeId: string =
    profile?.id ??
    storedUser.employeeId ??
    "Not available";

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "#F8FAFC",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ py: 5 }}
      >
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2.5,
                sm: 3.5,
              },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, #FFFFFF 0%, #F5F7FF 100%)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                justifyContent:
                  "space-between",
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
                  My Profile
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  View your account and update
                  your personal information.
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
              >
                <Tooltip title="Refresh profile">
                  <span>
                    <IconButton
                      type="button"
                      disabled={
                        loading || saving
                      }
                      onClick={() =>
                        void loadProfile()
                      }
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor:
                          "background.paper",
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                {!editing && (
                  <Button
                    type="button"
                    variant="contained"
                    disableElevation
                    startIcon={<EditIcon />}
                    disabled={
                      loading || !profile
                    }
                    onClick={
                      handleStartEditing
                    }
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                    }}
                  >
                    Edit profile
                  </Button>
                )}
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

          {loading ? (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={3}
                sx={{
                  alignItems: "center",
                }}
              >
                <Skeleton
                  variant="circular"
                  width={100}
                  height={100}
                />

                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 420,
                  }}
                >
                  <Skeleton
                    width="65%"
                    height={42}
                  />

                  <Skeleton
                    width="90%"
                    height={28}
                  />

                  <Skeleton
                    width="45%"
                    height={28}
                  />
                </Box>
              </Stack>
            </Paper>
          ) : profile ? (
            <>
              <Paper
                elevation={0}
                sx={{
                  p: {
                    xs: 2.5,
                    sm: 3.5,
                  },
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={3}
                  sx={{
                    alignItems: {
                      xs: "flex-start",
                      sm: "center",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 96,
                      height: 96,
                      bgcolor: "#4F46E5",
                      fontSize: 30,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(
                      profile.firstName,
                      profile.lastName,
                    )}
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: -0.5,
                      }}
                    >
                      {fullName}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {email}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        display: "inline-block",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 10,
                        bgcolor: "#EEF2FF",
                        color: "#4338CA",
                        fontWeight: 600,
                      }}
                    >
                      {formatRole(
                        storedUser.role,
                      )}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {!editing ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: {
                      xs: 2.5,
                      sm: 3.5,
                    },
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 0.5,
                    }}
                  >
                    Profile information
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    Account, work and contact
                    information linked to your
                    employee record.
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    <ProfileField
                      icon={<PersonIcon />}
                      label="Full name"
                      value={fullName}
                    />

                    <ProfileField
                      icon={<EmailIcon />}
                      label="Email address"
                      value={email}
                    />

                    <ProfileField
                      icon={<SecurityIcon />}
                      label="Account role"
                      value={formatRole(
                        storedUser.role,
                      )}
                    />

                    <ProfileField
                      icon={<BadgeIcon />}
                      label="Employee ID"
                      value={employeeId}
                    />

                    <ProfileField
                      icon={<ApartmentIcon />}
                      label="Department"
                      value={departmentName}
                    />

                    <ProfileField
                      icon={<LocationOnIcon />}
                      label="Street"
                      value={
                        profile.street ??
                        ""
                      }
                    />

                    <ProfileField
                      icon={<LocationOnIcon />}
                      label="City"
                      value={
                        profile.city ??
                        ""
                      }
                    />

                    <ProfileField
                      icon={<LocationOnIcon />}
                      label="Country"
                      value={
                        profile.country ??
                        ""
                      }
                    />

                    <ProfileField
                      icon={<LocationOnIcon />}
                      label="Postal code"
                      value={
                        profile.postalCode ??
                        ""
                      }
                    />
                  </Box>
                </Paper>
              ) : (
                <Paper
                  component="form"
                  onSubmit={
                    event =>
                      void handleSubmit(event)
                  }
                  elevation={0}
                  sx={{
                    p: {
                      xs: 2.5,
                      sm: 3.5,
                    },
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Edit personal details
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, mb: 3 }}
                  >
                    Your account role, email,
                    department and employee ID
                    cannot be changed here.
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    <TextField
                      required
                      fullWidth
                      name="firstName"
                      label="First name"
                      value={
                        formValues.firstName
                      }
                      disabled={saving}
                      onChange={
                        handleInputChange
                      }
                    />

                    <TextField
                      required
                      fullWidth
                      name="lastName"
                      label="Last name"
                      value={
                        formValues.lastName
                      }
                      disabled={saving}
                      onChange={
                        handleInputChange
                      }
                    />

                    <TextField
                      fullWidth
                      name="street"
                      label="Street"
                      value={
                        formValues.street
                      }
                      disabled={saving}
                      onChange={
                        handleInputChange
                      }
                    />

                    <TextField
                      fullWidth
                      name="city"
                      label="City"
                      value={
                        formValues.city
                      }
                      disabled={saving}
                      onChange={
                        handleInputChange
                      }
                    />

                    <TextField
                      fullWidth
                      name="country"
                      label="Country"
                      value={
                        formValues.country
                      }
                      disabled={saving}
                      onChange={
                        handleInputChange
                      }
                    />

                    <TextField
                      fullWidth
                      name="postalCode"
                      label="Postal code"
                      value={
                        formValues.postalCode
                      }
                      disabled={saving}
                      onChange={
                        handleInputChange
                      }
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      disabled={saving}
                      onClick={
                        handleCancelEditing
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      disableElevation
                      disabled={saving || !hasChanges}
                      startIcon={
                        saving ? (
                          <CircularProgress
                            size={18}
                            color="inherit"
                          />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      sx={{
                        borderRadius: 2,
                        px: 2.5,
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : "Save changes"}
                    </Button>
                  </Stack>
                </Paper>
              )}
            </>
          ) : (
            <Alert severity="warning">
              This account is not linked to an
              employee profile.
            </Alert>
          )}
        </Stack>
      </Container>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() =>
          setSuccessMessage("")
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setSuccessMessage("")
          }
          sx={{ borderRadius: 2 }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function updateStoredUserName(
  firstName: string,
  lastName: string,
): void {
  const storedUserJson: string | null =
    localStorage.getItem("authUser");

  if (!storedUserJson) {
    return;
  }

  try {
    const storedUser =
      JSON.parse(
        storedUserJson,
      ) as StoredUser;

    const updatedUser: StoredUser = {
      ...storedUser,
      fullName:
        `${firstName.trim()} ${lastName.trim()}`.trim(),
    };

    localStorage.setItem(
      "authUser",
      JSON.stringify(updatedUser),
    );
  } catch {
    // Ignore invalid stored data. ProtectedRoute
    // handles invalid authentication information.
  }
}