import {
  useEffect,
  useState,
} from "react";

import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

interface StoredUser {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  departmentId: string | null;
  employeeId: string | null;
  expiresAtUtc: string;
}

interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  departmentId: string | null;
  departmentName: string | null;
  createdAtUtc: string;
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

interface ApiError {
  message?: string;
  errors?: string[];
}

interface FormFieldProps {
  label: string;
  name: keyof ProfileForm | "email" | "department";
  value: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}

const TOKEN_KEY =
  "authToken";

const USER_KEY =
  "authUser";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

const emptyProfileForm: ProfileForm = {
  firstName: "",
  lastName: "",
  street: "",
  city: "",
  country: "",
  postalCode: "",
};

export default function DashboardPage() {
  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(TOKEN_KEY);

  const storedUserJson =
    localStorage.getItem(USER_KEY);

  const [currentUser, setCurrentUser] =
    useState<StoredUser | null>(() => {
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
    });

  const [profile, setProfile] =
    useState<EmployeeProfile | null>(null);

  const [form, setForm] =
    useState<ProfileForm>({
      ...emptyProfileForm,
    });

  const [originalForm, setOriginalForm] =
    useState<ProfileForm>({
      ...emptyProfileForm,
    });

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const isEmployee =
    currentUser?.role === "Employee";

  const profileHasChanged =
    hasProfileChanged(
      form,
      originalForm,
    );

  useEffect(() => {
    if (
      !token ||
      !currentUser ||
      currentUser.role !== "Employee"
    ) {
      setIsLoading(false);
      return;
    }

    void loadProfile();
  }, []);

  if (!token || !currentUser) {
    clearAuthentication();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  async function loadProfile(): Promise<void> {
    setError("");

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/employees/me`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const responseBody =
        await readResponseBody(response);

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthentication();

          navigate(
            "/login",
            {
              replace: true,
            },
          );

          return;
        }

        throw new Error(
          getErrorMessage(
            responseBody,
            "Your employee profile could not be loaded.",
          ),
        );
      }

      const employeeProfile =
        responseBody as EmployeeProfile;

      const loadedForm =
        createFormFromProfile(
          employeeProfile,
        );

      setProfile(employeeProfile);
      setForm(loadedForm);
      setOriginalForm(loadedForm);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your employee profile could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const fieldName =
      event.target.name as keyof ProfileForm;

    const fieldValue =
      event.target.value;

    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: fieldValue,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentUser) {
      setError(
        "The signed-in user could not be found.",
      );

      return;
    }

    const normalizedForm =
      normalizeProfileForm(form);

    if (!normalizedForm.firstName) {
      setError(
        "First name is required.",
      );

      return;
    }

    if (!normalizedForm.lastName) {
      setError(
        "Last name is required.",
      );

      return;
    }

    if (
      !hasProfileChanged(
        normalizedForm,
        originalForm,
      )
    ) {
      setError(
        "No changes were made.",
      );

      return;
    }

    setIsSaving(true);

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/employees/me`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify(
              normalizedForm,
            ),
          },
        );

      const responseBody =
        await readResponseBody(response);

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthentication();

          navigate(
            "/login",
            {
              replace: true,
            },
          );

          return;
        }

        throw new Error(
          getErrorMessage(
            responseBody,
            "Your profile could not be updated.",
          ),
        );
      }

      const updatedFullName =
        `${normalizedForm.firstName} ${normalizedForm.lastName}`;

      const updatedUser: StoredUser = {
        userId:
          currentUser.userId,

        fullName:
          updatedFullName,

        email:
          currentUser.email,

        role:
          currentUser.role,

        departmentId:
          currentUser.departmentId,

        employeeId:
          currentUser.employeeId,

        expiresAtUtc:
          currentUser.expiresAtUtc,
      };

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(updatedUser),
      );

      setCurrentUser(updatedUser);

      setForm(normalizedForm);
      setOriginalForm(normalizedForm);

      setProfile(
        (currentProfile) => {
          if (!currentProfile) {
            return currentProfile;
          }

          return {
            ...currentProfile,
            firstName:
              normalizedForm.firstName,

            lastName:
              normalizedForm.lastName,

            fullName:
              updatedFullName,

            street:
              normalizedForm.street,

            city:
              normalizedForm.city,

            country:
              normalizedForm.country,

            postalCode:
              normalizedForm.postalCode,
          };
        },
      );

      setSuccess(
        "Your details were updated successfully.",
      );
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your profile could not be updated.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset(): void {
    setForm({
      ...originalForm,
    });

    setError("");
    setSuccess("");
  }

  function handleLogout(): void {
    clearAuthentication();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.dashboard}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              Employee Management System
            </p>

            <h1 style={styles.heading}>
              Welcome, {currentUser.fullName}
            </h1>

            <p style={styles.subtitle}>
              Manage your employee profile and
              personal information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Sign Out
          </button>
        </header>

        <section style={styles.summaryGrid}>
          <article style={styles.summaryCard}>
            <span style={styles.label}>
              Email
            </span>

            <strong>
              {currentUser.email}
            </strong>
          </article>

          <article style={styles.summaryCard}>
            <span style={styles.label}>
              Role
            </span>

            <strong>
              {currentUser.role}
            </strong>
          </article>

          <article style={styles.summaryCard}>
            <span style={styles.label}>
              Department
            </span>

            <strong>
              {profile?.departmentName ??
                "Not assigned"}
            </strong>
          </article>
        </section>

        {!isEmployee && (
          <section style={styles.card}>
            <h2 style={styles.sectionHeading}>
              Dashboard
            </h2>

            <p>
              Profile editing is currently
              available for employee accounts.
            </p>
          </section>
        )}

        {isEmployee && isLoading && (
          <section style={styles.card}>
            <p>
              Loading your employee profile...
            </p>
          </section>
        )}

        {isEmployee &&
          !isLoading &&
          !profile && (
            <section style={styles.card}>
              <div style={styles.errorMessage}>
                {error ||
                  "No employee profile is linked to this account."}
              </div>
            </section>
          )}

        {isEmployee &&
          !isLoading &&
          profile && (
            <section style={styles.card}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionHeading}>
                    My details
                  </h2>

                  <p style={styles.sectionDescription}>
                    Update your personal details.
                    Email, role and department can
                    only be changed by an
                    administrator.
                  </p>
                </div>
              </div>

              {error && (
                <div style={styles.errorMessage}>
                  {error}
                </div>
              )}

              {success && (
                <div style={styles.successMessage}>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={styles.formGrid}>
                  <FormField
                    label="First name"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    required
                  />

                  <FormField
                    label="Last name"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    required
                  />

                  <FormField
                    label="Email"
                    name="email"
                    value={profile.email}
                    disabled
                  />

                  <FormField
                    label="Department"
                    name="department"
                    value={
                      profile.departmentName ??
                      "Not assigned"
                    }
                    disabled
                  />

                  <FormField
                    label="Street"
                    name="street"
                    value={form.street}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />

                  <FormField
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />

                  <FormField
                    label="Country"
                    name="country"
                    value={form.country}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />

                  <FormField
                    label="Postal code"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={
                      isSaving ||
                      !profileHasChanged
                    }
                    style={{
                      ...styles.resetButton,

                      opacity:
                        isSaving ||
                        !profileHasChanged
                          ? 0.6
                          : 1,

                      cursor:
                        isSaving ||
                        !profileHasChanged
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Cancel changes
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isSaving ||
                      !profileHasChanged
                    }
                    style={{
                      ...styles.saveButton,

                      opacity:
                        isSaving ||
                        !profileHasChanged
                          ? 0.6
                          : 1,

                      cursor:
                        isSaving ||
                        !profileHasChanged
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isSaving
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          )}
      </div>
    </main>
  );
}

function FormField({
  label,
  name,
  value,
  disabled = false,
  required = false,
  onChange,
}: FormFieldProps) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label}
      </span>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={{
          ...styles.input,

          background:
            disabled
              ? "#f1f3f5"
              : "#ffffff",

          cursor:
            disabled
              ? "not-allowed"
              : "text",
        }}
      />
    </label>
  );
}

function createFormFromProfile(
  employeeProfile: EmployeeProfile,
): ProfileForm {
  return {
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
  };
}

function normalizeProfileForm(
  profileForm: ProfileForm,
): ProfileForm {
  return {
    firstName:
      profileForm.firstName.trim(),

    lastName:
      profileForm.lastName.trim(),

    street:
      profileForm.street.trim(),

    city:
      profileForm.city.trim(),

    country:
      profileForm.country.trim(),

    postalCode:
      profileForm.postalCode.trim(),
  };
}

function hasProfileChanged(
  currentForm: ProfileForm,
  savedForm: ProfileForm,
): boolean {
  const normalizedCurrentForm =
    normalizeProfileForm(currentForm);

  const normalizedSavedForm =
    normalizeProfileForm(savedForm);

  return (
    normalizedCurrentForm.firstName !==
      normalizedSavedForm.firstName ||

    normalizedCurrentForm.lastName !==
      normalizedSavedForm.lastName ||

    normalizedCurrentForm.street !==
      normalizedSavedForm.street ||

    normalizedCurrentForm.city !==
      normalizedSavedForm.city ||

    normalizedCurrentForm.country !==
      normalizedSavedForm.country ||

    normalizedCurrentForm.postalCode !==
      normalizedSavedForm.postalCode
  );
}

async function readResponseBody(
  response: Response,
): Promise<unknown> {
  if (response.status === 204) {
    return {};
  }

  const contentType =
    response.headers.get(
      "content-type",
    );

  if (
    contentType?.includes(
      "application/json",
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  return text
    ? {
        message: text,
      }
    : {};
}

function getErrorMessage(
  responseBody: unknown,
  fallbackMessage: string,
): string {
  if (
    typeof responseBody !== "object" ||
    responseBody === null
  ) {
    return fallbackMessage;
  }

  const error =
    responseBody as ApiError;

  if (
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    Array.isArray(error.errors) &&
    error.errors.length > 0
  ) {
    return error.errors.join(" ");
  }

  return fallbackMessage;
}

function clearAuthentication(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f8",
    padding: "40px 20px",
  },

  dashboard: {
    width: "100%",
    maxWidth: 1000,
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 24,
  },

  eyebrow: {
    color: "#667085",
    fontSize: 14,
    margin: "0 0 8px",
  },

  heading: {
    margin: "0 0 8px",
    color: "#101828",
  },

  subtitle: {
    margin: 0,
    color: "#667085",
  },

  logoutButton: {
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    background: "#ffffff",
    padding: "10px 18px",
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },

  summaryCard: {
    background: "#ffffff",
    borderRadius: 10,
    padding: 20,
    boxShadow:
      "0 1px 4px rgba(16,24,40,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  card: {
    background: "#ffffff",
    borderRadius: 12,
    padding: 28,
    boxShadow:
      "0 2px 10px rgba(16,24,40,0.08)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  sectionHeading: {
    margin: "0 0 6px",
    color: "#101828",
  },

  sectionDescription: {
    margin: 0,
    color: "#667085",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 20,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  label: {
    color: "#475467",
    fontSize: 14,
    fontWeight: 500,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    padding: "11px 12px",
    fontSize: 15,
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },

  resetButton: {
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    background: "#ffffff",
    color: "#344054",
    padding: "11px 22px",
    fontSize: 15,
    fontWeight: 600,
  },

  saveButton: {
    border: 0,
    borderRadius: 8,
    background: "#2563eb",
    color: "#ffffff",
    padding: "11px 22px",
    fontSize: 15,
    fontWeight: 600,
  },

  errorMessage: {
    background: "#fef3f2",
    color: "#b42318",
    border: "1px solid #fecdca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },

  successMessage: {
    background: "#ecfdf3",
    color: "#027a48",
    border: "1px solid #abefc6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
};