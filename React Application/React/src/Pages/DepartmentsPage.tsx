import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import AddIcon from "@mui/icons-material/Add";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
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
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../services/departmentService";

import type {
  Department,
} from "../Types/department";

export default function DepartmentsPage():
  React.ReactElement {
  const [
    departments,
    setDepartments,
  ] = useState<Department[]>([]);

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    departmentDialogOpen,
    setDepartmentDialogOpen,
  ] = useState<boolean>(false);

  const [
    selectedDepartment,
    setSelectedDepartment,
  ] = useState<Department | null>(
    null,
  );

  const [
    departmentToDelete,
    setDepartmentToDelete,
  ] = useState<Department | null>(
    null,
  );

  const [
    name,
    setName,
  ] = useState<string>("");

  const [
    saving,
    setSaving,
  ] = useState<boolean>(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState<string>("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string>("");

  const DEPARTMENTS_PER_BATCH = 10;

  const [
    visibleDepartmentCount,
    setVisibleDepartmentCount,
  ] = useState<number>(
    DEPARTMENTS_PER_BATCH,
  );

  const scrollContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const loadMoreTriggerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const displayedDepartments:
    Department[] =
    departments.slice(
      0,
      visibleDepartmentCount,
    );

  const hasMoreDepartments:
    boolean =
    visibleDepartmentCount <
    departments.length;

  useEffect(() => {
    setVisibleDepartmentCount(
      DEPARTMENTS_PER_BATCH,
    );
  }, [departments]);

  useEffect(() => {
    const trigger:
      HTMLDivElement | null =
      loadMoreTriggerRef.current;

    if (
      !trigger ||
      !hasMoreDepartments
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (
          entries:
            IntersectionObserverEntry[],
        ): void => {
          const entry:
            IntersectionObserverEntry | undefined =
            entries[0];

          if (entry?.isIntersecting) {
            setVisibleDepartmentCount(
              (
                currentCount:
                  number,
              ): number =>
                Math.min(
                  currentCount +
                    DEPARTMENTS_PER_BATCH,
                  departments.length,
                ),
            );
          }
        },
        {
          root:
            scrollContainerRef.current,
          rootMargin:
            "150px 0px",
          threshold: 0.1,
        },
      );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [
    departments.length,
    hasMoreDepartments,
  ]);

  const loadDepartments =
    useCallback(
      async (): Promise<void> => {
        setLoading(true);
        setError("");

        try {
          const result: Department[] =
            await getDepartments();

          setDepartments(result);
        } catch (
          caughtError: unknown
        ) {
          const message: string =
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load departments.";

          setError(message);
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  function handleCreate(): void {
    setSelectedDepartment(null);
    setName("");
    setDepartmentDialogOpen(true);
  }

  function handleEdit(
    department: Department,
  ): void {
    setSelectedDepartment(
      department,
    );

    setName(
      department.name,
    );

    setDepartmentDialogOpen(
      true,
    );
  }

  function handleDepartmentDialogClose():
    void {
    if (saving) {
      return;
    }

    setDepartmentDialogOpen(
      false,
    );

    setSelectedDepartment(
      null,
    );

    setName("");
  }

  async function handleSave():
    Promise<void> {
    const trimmedName: string =
      name.trim();

    if (!trimmedName) {
      setError(
        "Department name is required.",
      );

      return;
    }

    if (
      selectedDepartment &&
      trimmedName === selectedDepartment.name.trim()
    ) {
      setError(
        "No changes were made.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      if (selectedDepartment) {
        await updateDepartment(
          selectedDepartment.id,
          {
            name: trimmedName,
          },
        );

        setSuccessMessage(
          `"${trimmedName}" was updated successfully.`,
        );
      } else {
        await createDepartment({
          name: trimmedName,
        });

        setSuccessMessage(
          `"${trimmedName}" was created successfully.`,
        );
      }

      setDepartmentDialogOpen(
        false,
      );

      setSelectedDepartment(
        null,
      );

      setName("");

      await loadDepartments();
    } catch (
      caughtError: unknown
    ) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save department.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteRequest(
    department: Department,
  ): void {
    setDepartmentToDelete(
      department,
    );
  }

  function handleDeleteCancel():
    void {
    if (deletingId) {
      return;
    }

    setDepartmentToDelete(
      null,
    );
  }

  async function handleDeleteConfirm():
    Promise<void> {
    if (
      !departmentToDelete ||
      deletingId
    ) {
      return;
    }

    const department: Department =
      departmentToDelete;

    setDeletingId(
      department.id,
    );

    setError("");

    try {
      await deleteDepartment(
        department.id,
      );

      setDepartmentToDelete(
        null,
      );

      setSuccessMessage(
        `"${department.name}" was deleted successfully.`,
      );

      await loadDepartments();
    } catch (
      caughtError: unknown
    ) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete department.";

      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  const isDeletingSelectedDepartment:
    boolean =
    Boolean(
      departmentToDelete &&
        deletingId ===
          departmentToDelete.id,
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
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ opacity: 0.8, letterSpacing: 1.5 }}
                >
                  Department Management
                </Typography>

                <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
                  Departments
                </Typography>

                <Typography sx={{ mt: 1, opacity: 0.9 }}>
                  Create, update and manage organisation departments.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                  onClick={() => void loadDepartments()}
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
                  onClick={handleCreate}
                  sx={{
                    bgcolor: "common.white",
                    color: "primary.main",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.92)" },
                  }}
                >
                  Add Department
                </Button>
              </Stack>
            </Box>
          </Paper>

          {error && (
            <Alert
              severity="error"
              onClose={() =>
                setError("")
              }
              sx={{
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            {loading ? (
              <Box
                sx={{
                  py: 8,
                  display: "flex",
                  justifyContent:
                    "center",
                }}
              >
                <CircularProgress />
              </Box>
            ) : departments.length ===
              0 ? (
              <Box
                sx={{
                  py: 8,
                  px: 3,
                  textAlign:
                    "center",
                }}
              >
                <Avatar
                  sx={{
                    mx: "auto",
                    mb: 2,
                    width: 64,
                    height: 64,
                    bgcolor:
                      "primary.main",
                  }}
                >
                  <ApartmentIcon />
                </Avatar>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  No departments yet
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    mb: 3,
                  }}
                >
                  Create your first
                  department to get
                  started.
                </Typography>

                <Button
                  type="button"
                  variant="contained"
                  startIcon={
                    <AddIcon />
                  }
                  onClick={
                    handleCreate
                  }
                >
                  Add department
                </Button>
              </Box>
            ) : (
              <TableContainer
                ref={scrollContainerRef}
                sx={{
                  maxHeight: {
                    xs: "58vh",
                    md: "56vh",
                  },
                  overflowY: "auto",
                  overscrollBehavior:
                    "contain",
                  scrollbarGutter:
                    "stable",
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        Sr. No
                      </TableCell>

                      <TableCell>
                        Department
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          width: 140,
                          minWidth: 140,
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {displayedDepartments.map(
                      (
                        department:
                          Department,
                        index:
                          number,
                      ) => (
                        <TableRow
                          key={
                            department.id
                          }
                          hover
                        >
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight:
                                  600,
                                color:
                                  "text.secondary",
                                fontVariantNumeric:
                                  "tabular-nums",
                                letterSpacing:
                                  0.4,
                              }}
                            >
                              {String(
                                index + 1,
                              ).padStart(
                                3,
                                "0",
                              )}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight:
                                  600,
                              }}
                            >
                              {
                                department.name
                              }
                            </Typography>
                          </TableCell>

                          <TableCell
                            align="center"
                            sx={{
                              width: 140,
                              minWidth: 140,
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Tooltip title="Edit department">
                                <IconButton
                                  type="button"
                                  aria-label={`Edit ${department.name}`}
                                  onClick={() =>
                                    handleEdit(
                                      department,
                                    )
                                  }
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete department">
                                <span>
                                  <IconButton
                                    type="button"
                                    color="error"
                                    aria-label={`Delete ${department.name}`}
                                    disabled={
                                      deletingId ===
                                      department.id
                                    }
                                    onClick={() =>
                                      handleDeleteRequest(
                                        department,
                                      )
                                    }
                                  >
                                    {deletingId ===
                                    department.id ? (
                                      <CircularProgress
                                        size={20}
                                        color="inherit"
                                      />
                                    ) : (
                                      <DeleteIcon />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>

                <Box
                  ref={loadMoreTriggerRef}
                  sx={{ height: 1 }}
                />
              </TableContainer>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Create / Edit Department */}
      <Dialog
        open={
          departmentDialogOpen
        }
        onClose={
          handleDepartmentDialogClose
        }
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          {selectedDepartment
            ? "Edit Department"
            : "Create Department"}
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
            }}
          >
            {selectedDepartment
              ? "Update the department information below."
              : "Enter a name for the new department."}
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Department name"
            value={name}
            disabled={saving}
            onChange={(
              event:
                React.ChangeEvent<HTMLInputElement>,
            ) =>
              setName(
                event.target.value,
              )
            }
            onKeyDown={(
              event:
                React.KeyboardEvent<HTMLInputElement>,
            ) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();

                void handleSave();
              }
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            type="button"
            onClick={
              handleDepartmentDialogClose
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="contained"
            disableElevation
            disabled={
              saving ||
              !name.trim() ||
              Boolean(
                selectedDepartment &&
                name.trim() === selectedDepartment.name.trim()
              )
            }
            onClick={() =>
              void handleSave()
            }
            startIcon={
              saving ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : undefined
            }
          >
            {saving
              ? "Saving..."
              : selectedDepartment
                ? "Save changes"
                : "Create department"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={
          departmentToDelete !==
          null
        }
        onClose={
          handleDeleteCancel
        }
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
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          Delete department?
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to
            delete{" "}
            <Box
              component="span"
              sx={{
                fontWeight: 700,
                color:
                  "text.primary",
              }}
            >
              {departmentToDelete?.name}
            </Box>
            ? Employees currently
            assigned to this
            department will become
            unassigned.
          </DialogContentText>

          <Alert
            severity="warning"
            sx={{
              mt: 2.5,
              borderRadius: 2,
            }}
          >
            This action cannot be
            undone.
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            type="button"
            onClick={
              handleDeleteCancel
            }
            disabled={
              isDeletingSelectedDepartment
            }
          >
            Cancel
          </Button>

          <Button
            type="button"
            color="error"
            variant="contained"
            disableElevation
            startIcon={
              isDeletingSelectedDepartment ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <DeleteIcon />
              )
            }
            disabled={
              isDeletingSelectedDepartment
            }
            onClick={() =>
              void handleDeleteConfirm()
            }
          >
            {isDeletingSelectedDepartment
              ? "Deleting..."
              : "Delete department"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={Boolean(
          successMessage,
        )}
        autoHideDuration={4000}
        onClose={(
          _event,
          reason,
        ) => {
          if (
            reason ===
            "clickaway"
          ) {
            return;
          }

          setSuccessMessage("");
        }}
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
          sx={{
            width: "100%",
            borderRadius: 2,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}