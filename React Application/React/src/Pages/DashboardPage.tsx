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

import {
  AppPermissions,
} from "../Constants/permissions";

import type {
  StoredUser,
} from "../Types/auth";

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
  title?: string;

  errors?:
    | string[]
    | Record<string, string[]>;
}

interface FormFieldProps {
  label: string;

  name:
    | keyof ProfileForm
    | "email"
    | "department";

  value: string;

  disabled?: boolean;
  required?: boolean;

  onChange?: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}

interface ModuleCard {
  title: string;
  description: string;
  path: string;
  permission: string;
}

const TOKEN_KEY =
  "authToken";

const USER_KEY =
  "authUser";

const API_BASE_URL =
  (
    import.meta.env.VITE_API_BASE_URL ??
    ""
  ).replace(
    /\/+$/,
    "",
  );

const emptyProfileForm: ProfileForm = {
  firstName: "",
  lastName: "",
  street: "",
  city: "",
  country: "",
  postalCode: "",
};

const applicationModules: ModuleCard[] = [
  {
    title:
      "Employees",

    description:
      "View employee information available to your account.",

    path:
      "/employee/employees",

    permission:
      AppPermissions.ViewEmployees,
  },
  {
    title:
      "Departments",

    description:
      "View departments and organizational information.",

    path:
      "/employee/departments",

    permission:
      AppPermissions.ViewDepartments,
  },
  {
    title:
      "Projects",

    description:
      "View projects available to your account.",

    path:
      "/employee/projects",

    permission:
      AppPermissions.ViewProjects,
  },
];

export default function DashboardPage():
  React.ReactElement {
  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(
      TOKEN_KEY,
    );

  const storedUserJson =
    localStorage.getItem(
      USER_KEY,
    );

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<StoredUser | null>(
      () => {
        if (!storedUserJson) {
          return null;
        }

        try {
          const parsedUser =
            JSON.parse(
              storedUserJson,
            ) as StoredUser;

          return {
            ...parsedUser,

            permissions:
              Array.isArray(
                parsedUser.permissions,
              )
                ? parsedUser.permissions
                : [],
          };
        } catch {
          return null;
        }
      },
    );

  const [
    profile,
    setProfile,
  ] =
    useState<EmployeeProfile | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<ProfileForm>({
      ...emptyProfileForm,
    });

  const [
    originalForm,
    setOriginalForm,
  ] =
    useState<ProfileForm>({
      ...emptyProfileForm,
    });

  const [
    isLoading,
    setIsLoading,
  ] =
    useState<boolean>(
      true,
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState<boolean>(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<string>("");

  const [
    success,
    setSuccess,
  ] =
    useState<string>("");

  const profileHasChanged =
    hasProfileChanged(
      form,
      originalForm,
    );

  const visibleModules: ModuleCard[] =
    currentUser
      ? applicationModules.filter(
          module =>
            currentUser.permissions.includes(
              module.permission,
            ),
        )
      : [];

  useEffect(() => {
    if (
      !token ||
      !currentUser
    ) {
      setIsLoading(
        false,
      );

      return;
    }

    void loadProfile();
  }, []);

  if (
    !token ||
    !currentUser
  ) {
    clearAuthentication();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  async function loadProfile():
    Promise<void> {
    if (!token) {
      setIsLoading(
        false,
      );

      return;
    }

    setError("");

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/employees/me`,
          {
            method:
              "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const responseBody =
        await readResponseBody(
          response,
        );

      if (!response.ok) {
        if (
          response.status ===
          401
        ) {
          clearAuthentication();

          navigate(
            "/login",
            {
              replace:
                true,
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

      setProfile(
        employeeProfile,
      );

      setForm(
        loadedForm,
      );

      setOriginalForm(
        loadedForm,
      );
    } catch (
      caughtError:
        unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your employee profile could not be loaded.",
      );
    } finally {
      setIsLoading(
        false,
      );
    }
  }

  function handleInputChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const fieldName =
      event.target.name as keyof ProfileForm;

    const fieldValue =
      event.target.value;

    setForm(
      currentForm => ({
        ...currentForm,

        [fieldName]:
          fieldValue,
      }),
    );

    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
     * currentUser is StoredUser | null.
     *
     * Check it again inside this async
     * handler so TypeScript can safely
     * treat it as StoredUser.
     */
    if (
      !currentUser ||
      !token
    ) {
      clearAuthentication();

      navigate(
        "/login",
        {
          replace:
            true,
        },
      );

      return;
    }

    /*
     * Capture a guaranteed StoredUser
     * before entering async operations.
     */
    const authenticatedUser:
      StoredUser =
      currentUser;

    const normalizedForm =
      normalizeProfileForm(
        form,
      );

    if (
      !normalizedForm.firstName
    ) {
      setError(
        "First name is required.",
      );

      return;
    }

    if (
      !normalizedForm.lastName
    ) {
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

    setIsSaving(
      true,
    );

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/employees/me`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                normalizedForm,
              ),
          },
        );

      const responseBody =
        await readResponseBody(
          response,
        );

      if (!response.ok) {
        if (
          response.status ===
          401
        ) {
          clearAuthentication();

          navigate(
            "/login",
            {
              replace:
                true,
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

      /*
       * authenticatedUser is guaranteed
       * to be StoredUser, so spreading it
       * keeps all required properties:
       *
       * userId
       * email
       * role
       * departmentId
       * employeeId
       * expiresAtUtc
       * permissions
       */
      const updatedUser:
        StoredUser = {
        ...authenticatedUser,

        fullName:
          updatedFullName,
      };

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(
          updatedUser,
        ),
      );

      setCurrentUser(
        updatedUser,
      );

      setForm(
        normalizedForm,
      );

      setOriginalForm(
        normalizedForm,
      );

      setProfile(
        currentProfile => {
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
    } catch (
      caughtError:
        unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your profile could not be updated.",
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  function handleReset():
    void {
    setForm({
      ...originalForm,
    });

    setError("");
    setSuccess("");
  }

  function handleLogout():
    void {
    clearAuthentication();

    navigate(
      "/login",
      {
        replace:
          true,
      },
    );
  }

  return (
    <main
      style={
        styles.page
      }
    >
      <div
        style={
          styles.dashboard
        }
      >
        <header
          style={
            styles.header
          }
        >
          <div>
            <p
              style={
                styles.eyebrow
              }
            >
              Employee Management
              System
            </p>

            <h1
              style={
                styles.heading
              }
            >
              Welcome,{" "}
              {currentUser.fullName}
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              Manage your profile
              and access the modules
              assigned to you.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            style={
              styles.logoutButton
            }
          >
            Sign Out
          </button>
        </header>

        <section
          style={
            styles.summaryGrid
          }
        >
          <article
            style={
              styles.summaryCard
            }
          >
            <span
              style={
                styles.label
              }
            >
              Email
            </span>

            <strong>
              {currentUser.email}
            </strong>
          </article>

          <article
            style={
              styles.summaryCard
            }
          >
            <span
              style={
                styles.label
              }
            >
              Role
            </span>

            <strong>
              {currentUser.role}
            </strong>
          </article>

          <article
            style={
              styles.summaryCard
            }
          >
            <span
              style={
                styles.label
              }
            >
              Department
            </span>

            <strong>
              {profile
                ?.departmentName ??
                "Not assigned"}
            </strong>
          </article>

          <article
            style={
              styles.summaryCard
            }
          >
            <span
              style={
                styles.label
              }
            >
              Permissions
            </span>

            <strong>
              {
                currentUser
                  .permissions
                  .length
              }
            </strong>
          </article>
        </section>

        <section
          style={
            styles.card
          }
        >
          <div
            style={
              styles.sectionHeader
            }
          >
            <div>
              <h2
                style={
                  styles.sectionHeading
                }
              >
                My Modules
              </h2>

              <p
                style={
                  styles.sectionDescription
                }
              >
                Only modules assigned
                to your account are
                available.
              </p>
            </div>
          </div>

          {visibleModules.length ===
          0 ? (
            <div
              style={
                styles.infoMessage
              }
            >
              No additional modules
              have been assigned to
              your account.
            </div>
          ) : (
            <div
              style={
                styles.moduleGrid
              }
            >
              {visibleModules.map(
                module => (
                  <button
                    key={
                      module.permission
                    }
                    type="button"
                    style={
                      styles.moduleCard
                    }
                    onClick={() =>
                      navigate(
                        module.path,
                      )
                    }
                  >
                    <strong
                      style={
                        styles.moduleTitle
                      }
                    >
                      {module.title}
                    </strong>

                    <span
                      style={
                        styles
                          .moduleDescription
                      }
                    >
                      {
                        module.description
                      }
                    </span>

                    <span
                      style={
                        styles.moduleAction
                      }
                    >
                      Open module →
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </section>

        {isLoading && (
          <section
            style={
              styles.card
            }
          >
            <p>
              Loading your
              employee profile...
            </p>
          </section>
        )}

        {!isLoading &&
          !profile && (
            <section
              style={
                styles.card
              }
            >
              <div
                style={
                  styles.errorMessage
                }
              >
                {error ||
                  "No employee profile is linked to this account."}
              </div>
            </section>
          )}

        {!isLoading &&
          profile && (
            <section
              style={
                styles.card
              }
            >
              <div
                style={
                  styles.sectionHeader
                }
              >
                <div>
                  <h2
                    style={
                      styles.sectionHeading
                    }
                  >
                    My Details
                  </h2>

                  <p
                    style={
                      styles
                        .sectionDescription
                    }
                  >
                    Update your
                    personal details.
                    Email, role and
                    department can
                    only be changed
                    by an administrator.
                  </p>
                </div>
              </div>

              {error && (
                <div
                  style={
                    styles.errorMessage
                  }
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={
                    styles.successMessage
                  }
                >
                  {success}
                </div>
              )}

              <form
                onSubmit={
                  handleSubmit
                }
              >
                <div
                  style={
                    styles.formGrid
                  }
                >
                  <FormField
                    label="First name"
                    name="firstName"
                    value={
                      form.firstName
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      isSaving
                    }
                    required
                  />

                  <FormField
                    label="Last name"
                    name="lastName"
                    value={
                      form.lastName
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      isSaving
                    }
                    required
                  />

                  <FormField
                    label="Email"
                    name="email"
                    value={
                      profile.email
                    }
                    disabled
                  />

                  <FormField
                    label="Department"
                    name="department"
                    value={
                      profile
                        .departmentName ??
                      "Not assigned"
                    }
                    disabled
                  />

                  <FormField
                    label="Street"
                    name="street"
                    value={
                      form.street
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      isSaving
                    }
                  />

                  <FormField
                    label="City"
                    name="city"
                    value={
                      form.city
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      isSaving
                    }
                  />

                  <FormField
                    label="Country"
                    name="country"
                    value={
                      form.country
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      isSaving
                    }
                  />

                  <FormField
                    label="Postal code"
                    name="postalCode"
                    value={
                      form.postalCode
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      isSaving
                    }
                  />
                </div>

                <div
                  style={
                    styles.actions
                  }
                >
                  <button
                    type="button"
                    onClick={
                      handleReset
                    }
                    disabled={
                      isSaving ||
                      !profileHasChanged
                    }
                    style={{
                      ...styles
                        .resetButton,

                      opacity:
                        isSaving ||
                        !profileHasChanged
                          ? 0.6
                          : 1,
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
                      ...styles
                        .saveButton,

                      opacity:
                        isSaving ||
                        !profileHasChanged
                          ? 0.6
                          : 1,
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
}: FormFieldProps):
  React.ReactElement {
  return (
    <label
      style={
        styles.field
      }
    >
      <span
        style={
          styles.label
        }
      >
        {label}
      </span>

      <input
        type="text"
        name={
          name
        }
        value={
          value
        }
        onChange={
          onChange
        }
        disabled={
          disabled
        }
        required={
          required
        }
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
  employeeProfile:
    EmployeeProfile,
): ProfileForm {
  return {
    firstName:
      employeeProfile
        .firstName ?? "",

    lastName:
      employeeProfile
        .lastName ?? "",

    street:
      employeeProfile
        .street ?? "",

    city:
      employeeProfile
        .city ?? "",

    country:
      employeeProfile
        .country ?? "",

    postalCode:
      employeeProfile
        .postalCode ?? "",
  };
}

function normalizeProfileForm(
  profileForm:
    ProfileForm,
): ProfileForm {
  return {
    firstName:
      profileForm
        .firstName
        .trim(),

    lastName:
      profileForm
        .lastName
        .trim(),

    street:
      profileForm
        .street
        .trim(),

    city:
      profileForm
        .city
        .trim(),

    country:
      profileForm
        .country
        .trim(),

    postalCode:
      profileForm
        .postalCode
        .trim(),
  };
}

function hasProfileChanged(
  currentForm:
    ProfileForm,

  savedForm:
    ProfileForm,
): boolean {
  const current =
    normalizeProfileForm(
      currentForm,
    );

  const saved =
    normalizeProfileForm(
      savedForm,
    );

  return (
    current.firstName !==
      saved.firstName ||

    current.lastName !==
      saved.lastName ||

    current.street !==
      saved.street ||

    current.city !==
      saved.city ||

    current.country !==
      saved.country ||

    current.postalCode !==
      saved.postalCode
  );
}

async function readResponseBody(
  response:
    Response,
): Promise<unknown> {
  if (
    response.status ===
    204
  ) {
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
        message:
          text,
      }
    : {};
}

function getErrorMessage(
  responseBody:
    unknown,

  fallbackMessage:
    string,
): string {
  if (
    typeof responseBody !==
      "object" ||
    responseBody ===
      null
  ) {
    return fallbackMessage;
  }

  const apiError =
    responseBody as ApiError;

  if (
    typeof apiError.message ===
      "string" &&
    apiError.message.trim()
  ) {
    return apiError.message;
  }

  if (
    Array.isArray(
      apiError.errors,
    ) &&
    apiError.errors.length >
      0
  ) {
    return apiError.errors.join(
      " ",
    );
  }

  if (
    apiError.errors &&
    !Array.isArray(
      apiError.errors,
    )
  ) {
    const validationMessages =
      Object.values(
        apiError.errors,
      ).flat();

    if (
      validationMessages.length >
      0
    ) {
      return validationMessages.join(
        " ",
      );
    }
  }

  if (
    typeof apiError.title ===
      "string" &&
    apiError.title.trim()
  ) {
    return apiError.title;
  }

  return fallbackMessage;
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

const styles:
  Record<
    string,
    CSSProperties
  > = {
  page: {
    minHeight:
      "100vh",

    background:
      "#f4f6f8",

    padding:
      "40px 20px",
  },

  dashboard: {
    width:
      "100%",

    maxWidth:
      1100,

    margin:
      "0 auto",
  },

  header: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap:
      20,

    marginBottom:
      24,
  },

  eyebrow: {
    color:
      "#667085",

    fontSize:
      14,

    margin:
      "0 0 8px",
  },

  heading: {
    margin:
      "0 0 8px",

    color:
      "#101828",
  },

  subtitle: {
    margin:
      0,

    color:
      "#667085",
  },

  logoutButton: {
    border:
      "1px solid #d0d5dd",

    borderRadius:
      8,

    background:
      "#ffffff",

    padding:
      "10px 18px",

    cursor:
      "pointer",
  },

  summaryGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",

    gap:
      16,

    marginBottom:
      24,
  },

  summaryCard: {
    background:
      "#ffffff",

    borderRadius:
      10,

    padding:
      20,

    boxShadow:
      "0 1px 4px rgba(16,24,40,0.08)",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      8,
  },

  card: {
    background:
      "#ffffff",

    borderRadius:
      12,

    padding:
      28,

    boxShadow:
      "0 2px 10px rgba(16,24,40,0.08)",

    marginBottom:
      24,
  },

  moduleGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",

    gap:
      16,
  },

  moduleCard: {
    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "flex-start",

    textAlign:
      "left",

    gap:
      10,

    background:
      "#ffffff",

    border:
      "1px solid #e4e7ec",

    borderRadius:
      10,

    padding:
      20,

    cursor:
      "pointer",
  },

  moduleTitle: {
    color:
      "#101828",

    fontSize:
      17,
  },

  moduleDescription: {
    color:
      "#667085",

    fontSize:
      14,

    lineHeight:
      1.5,
  },

  moduleAction: {
    color:
      "#2563eb",

    fontWeight:
      600,

    fontSize:
      14,
  },

  infoMessage: {
    background:
      "#f2f4f7",

    color:
      "#475467",

    borderRadius:
      8,

    padding:
      14,
  },

  sectionHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    marginBottom:
      24,
  },

  sectionHeading: {
    margin:
      "0 0 6px",

    color:
      "#101828",
  },

  sectionDescription: {
    margin:
      0,

    color:
      "#667085",
  },

  formGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",

    gap:
      20,
  },

  field: {
    display:
      "flex",

    flexDirection:
      "column",

    gap:
      8,
  },

  label: {
    color:
      "#475467",

    fontSize:
      14,

    fontWeight:
      500,
  },

  input: {
    width:
      "100%",

    boxSizing:
      "border-box",

    border:
      "1px solid #d0d5dd",

    borderRadius:
      8,

    padding:
      "11px 12px",

    fontSize:
      15,
  },

  actions: {
    display:
      "flex",

    justifyContent:
      "flex-end",

    gap:
      12,

    marginTop:
      24,
  },

  resetButton: {
    border:
      "1px solid #d0d5dd",

    borderRadius:
      8,

    background:
      "#ffffff",

    color:
      "#344054",

    padding:
      "11px 22px",

    fontSize:
      15,

    fontWeight:
      600,
  },

  saveButton: {
    border:
      0,

    borderRadius:
      8,

    background:
      "#2563eb",

    color:
      "#ffffff",

    padding:
      "11px 22px",

    fontSize:
      15,

    fontWeight:
      600,
  },

  errorMessage: {
    background:
      "#fef3f2",

    color:
      "#b42318",

    border:
      "1px solid #fecdca",

    borderRadius:
      8,

    padding:
      12,

    marginBottom:
      20,
  },

  successMessage: {
    background:
      "#ecfdf3",

    color:
      "#027a48",

    border:
      "1px solid #abefc6",

    borderRadius:
      8,

    padding:
      12,

    marginBottom:
      20,
  },
};