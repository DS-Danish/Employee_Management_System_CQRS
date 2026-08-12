import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  applyLeave,
  getMyLeaveBalance,
  getMyLeaves,
} from "../services/leaveService";

import {
  LeaveStatus,
  LeaveType,
  getLeaveStatusLabel,
  getLeaveTypeLabel,
  type ApplyLeaveRequest,
  type Leave,
  type LeaveBalance,
} from "../Types/leave";

interface LeaveForm {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

const EMPTY_FORM: LeaveForm = {
  leaveType: LeaveType.Casual,
  startDate: "",
  endDate: "",
  reason: "",
};

export default function MyLeavesPage():
React.ReactElement {
  const [
    balances,
    setBalances,
  ] = useState<LeaveBalance[]>([]);

  const [
    leaves,
    setLeaves,
  ] = useState<Leave[]>([]);

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    submitting,
    setSubmitting,
  ] = useState<boolean>(false);

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState<boolean>(false);

  const [
    error,
    setError,
  ] = useState<string>("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string>("");

  const [
    form,
    setForm,
  ] = useState<LeaveForm>(
    EMPTY_FORM,
  );

  const currentYear: number =
    useMemo(
      () =>
        new Date().getFullYear(),
      [],
    );

  const loadData =
    useCallback(
      async (): Promise<void> => {
        setLoading(true);
        setError("");

        try {
          const [
            balanceResult,
            leaveResult,
          ] =
            await Promise.all([
              getMyLeaveBalance(
                currentYear,
              ),
              getMyLeaves(),
            ]);

          setBalances(
            balanceResult,
          );

          setLeaves(
            leaveResult,
          );
        } catch (
          caughtError: unknown
        ) {
          setError(
            getErrorMessage(
              caughtError,
              "Unable to load leave information.",
            ),
          );
        } finally {
          setLoading(false);
        }
      },
      [currentYear],
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (
      !form.startDate ||
      !form.endDate
    ) {
      setError(
        "Start date and end date are required.",
      );

      return;
    }

    if (!form.reason.trim()) {
      setError(
        "Please provide a reason for your leave.",
      );

      return;
    }

    if (
      new Date(form.endDate) <
      new Date(form.startDate)
    ) {
      setError(
        "End date cannot be before start date.",
      );

      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const request:
        ApplyLeaveRequest = {
          leaveType:
            form.leaveType,

          startDate:
            form.startDate,

          endDate:
            form.endDate,

          reason:
            form.reason.trim(),
        };

      await applyLeave(
        request,
      );

      setDialogOpen(false);

      setForm(
        EMPTY_FORM,
      );

      setSuccessMessage(
        "Leave application submitted successfully.",
      );

      await loadData();
    } catch (
      caughtError: unknown
    ) {
      setError(
        getErrorMessage(
          caughtError,
          "Unable to submit leave application.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "#F8FAFC",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          py: {
            xs: 3,
            md: 5,
          },
        }}
      >
        <Stack spacing={4}>
          {/* HEADER */}

          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 3,
                md: 4,
              },
              borderRadius: 3,
              background:
                "linear-gradient(135deg, #1976d2 0%, #512da8 100%)",
              color:
                "common.white",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                justifyContent:
                  "space-between",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    opacity: 0.8,
                    letterSpacing: 1.5,
                  }}
                >
                  Leave Management
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mt: 0.5,
                  }}
                >
                  My Leaves
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                  }}
                >
                  View your leave balance,
                  submit applications and
                  track their status.
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
              >
                <Button
                  variant="outlined"
                  startIcon={
                    <RefreshIcon />
                  }
                  disabled={loading}
                  onClick={() =>
                    void loadData()
                  }
                  sx={{
                    color:
                      "common.white",

                    borderColor:
                      "rgba(255,255,255,0.6)",

                    "&:hover": {
                      borderColor:
                        "common.white",
                    },
                  }}
                >
                  Refresh
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    <AddIcon />
                  }
                  onClick={() => {
                    setError("");
                    setDialogOpen(
                      true,
                    );
                  }}
                  sx={{
                    bgcolor:
                      "common.white",

                    color:
                      "primary.main",

                    "&:hover": {
                      bgcolor:
                        "#F8FAFC",
                    },
                  }}
                >
                  Apply Leave
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
            >
              {error}
            </Alert>
          )}

          {/* BALANCE */}

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
              }}
            >
              Leave Balance
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              Leave entitlement for{" "}
              {currentYear}.
            </Typography>
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "center",
                py: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Grid
              container
              spacing={3}
            >
              {balances.map(
                (
                  balance:
                    LeaveBalance,
                ) => (
                  <Grid
                    key={
                      balance.leaveType
                    }
                    size={{
                      xs: 12,
                      sm: 6,
                      lg: 3,
                    }}
                  >
                    <BalanceCard
                      balance={
                        balance
                      }
                    />
                  </Grid>
                ),
              )}
            </Grid>
          )}

          {/* LEAVE HISTORY */}

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
              }}
            >
              My Applications
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              Your submitted leave
              applications and their
              current status.
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor:
                "divider",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <Box
                sx={{
                  py: 5,
                  textAlign:
                    "center",
                }}
              >
                <CircularProgress />
              </Box>
            ) : leaves.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  textAlign:
                    "center",
                }}
              >
                <EventAvailableIcon
                  sx={{
                    fontSize: 50,
                    color:
                      "text.disabled",
                  }}
                />

                <Typography
                  variant="h6"
                  sx={{
                    mt: 1,
                    fontWeight: 600,
                  }}
                >
                  No leave applications
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  You have not submitted
                  any leave applications.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  overflowX: "auto",
                }}
              >
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    borderCollapse:
                      "collapse",

                    "& th": {
                      textAlign:
                        "left",
                      p: 2,
                      bgcolor:
                        "#F8FAFC",
                      fontWeight:
                        700,
                      whiteSpace:
                        "nowrap",
                    },

                    "& td": {
                      p: 2,
                      borderTop:
                        "1px solid",
                      borderColor:
                        "divider",
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>
                        Review Comment
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaves.map(
                      (
                        leave:
                          Leave,
                      ) => (
                        <tr
                          key={
                            leave.id
                          }
                        >
                          <td>
                            {getLeaveTypeLabel(
                              leave.leaveType,
                            )}
                          </td>

                          <td>
                            {formatDate(
                              leave.startDate,
                            )}
                            {" - "}
                            {formatDate(
                              leave.endDate,
                            )}
                          </td>

                          <td>
                            {
                              leave.numberOfDays
                            }
                          </td>

                          <td>
                            {
                              leave.reason
                            }
                          </td>

                          <td>
                            <StatusChip
                              status={
                                leave.status
                              }
                            />
                          </td>

                          <td>
                            {leave.reviewComment ??
                              "-"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </Box>
              </Box>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* APPLY LEAVE DIALOG */}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!submitting) {
            setDialogOpen(
              false,
            );
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <Box
          component="form"
          onSubmit={event =>
            void handleSubmit(
              event,
            )
          }
        >
          <DialogTitle>
            Apply for Leave
          </DialogTitle>

          <DialogContent>
            <Stack
              spacing={2.5}
              sx={{
                mt: 1,
              }}
            >
              <FormControl
                fullWidth
                required
              >
                <InputLabel>
                  Leave type
                </InputLabel>

                <Select
                  label="Leave type"
                  value={
                    form.leaveType
                  }
                  onChange={event => {
                    setForm(
                      previous => ({
                        ...previous,

                        leaveType:
                          Number(
                            event
                              .target
                              .value,
                          ) as LeaveType,
                      }),
                    );
                  }}
                >
                  <MenuItem
                    value={
                      LeaveType.Casual
                    }
                  >
                    Casual Leave
                  </MenuItem>

                  <MenuItem
                    value={
                      LeaveType.Annual
                    }
                  >
                    Annual Leave
                  </MenuItem>

                  <MenuItem
                    value={
                      LeaveType.Sick
                    }
                  >
                    Sick Leave
                  </MenuItem>

                  <MenuItem
                    value={
                      LeaveType.Unpaid
                    }
                  >
                    Unpaid Leave
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                required
                type="date"
                label="Start date"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                value={
                  form.startDate
                }
                onChange={event => {
                  setForm(
                    previous => ({
                      ...previous,
                      startDate:
                        event.target
                          .value,
                    }),
                  );
                }}
              />

              <TextField
                fullWidth
                required
                type="date"
                label="End date"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                value={
                  form.endDate
                }
                onChange={event => {
                  setForm(
                    previous => ({
                      ...previous,
                      endDate:
                        event.target
                          .value,
                    }),
                  );
                }}
              />

              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Reason"
                value={form.reason}
                slotProps={{
                    htmlInput: {
                    maxLength: 500,
                    },
                }}
                onChange={event => {
                    setForm(
                    previous => ({
                        ...previous,
                        reason: event.target.value,
                    }),
                    );
                }}
            />
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 3,
            }}
          >
            <Button
              type="button"
              disabled={submitting}
              onClick={() =>
                setDialogOpen(
                  false,
                )
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={
                submitting
                  ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  )
                  : (
                    <AddIcon />
                  )
              }
            >
              {submitting
                ? "Submitting..."
                : "Submit Application"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={Boolean(
          successMessage,
        )}
        autoHideDuration={4000}
        onClose={() =>
          setSuccessMessage("")
        }
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setSuccessMessage("")
          }
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function BalanceCard({
  balance,
}: {
  balance: LeaveBalance;
}): React.ReactElement {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        boxShadow: "none",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent
        sx={{
          p: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          {getLeaveTypeLabel(
            balance.leaveType,
          )}
        </Typography>

        {balance.isUnlimited ? (
          <>
            <Typography
              variant="h4"
              sx={{
                mt: 2,
                fontWeight: 700,
              }}
            >
              Unlimited
            </Typography>

            <Typography
              color="text.secondary"
              variant="body2"
              sx={{
                mt: 1,
              }}
            >
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant="h4"
              sx={{
                mt: 2,
                fontWeight: 700,
              }}
            >
              {
                balance
                  .availableToApplyDays
              }
            </Typography>

            <Typography
              color="text.secondary"
              variant="body2"
            >
              days available to apply
            </Typography>

            <Stack
              spacing={0.5}
              sx={{
                mt: 2,
              }}
            >
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatusChip({
  status,
}: {
  status: LeaveStatus;
}): React.ReactElement {
  if (
    status ===
    LeaveStatus.Approved
  ) {
    return (
      <Chip
        label={
          getLeaveStatusLabel(
            status,
          )
        }
        color="success"
        size="small"
      />
    );
  }

  if (
    status ===
    LeaveStatus.Rejected
  ) {
    return (
      <Chip
        label={
          getLeaveStatusLabel(
            status,
          )
        }
        color="error"
        size="small"
      />
    );
  }

  return (
    <Chip
      label={
        getLeaveStatusLabel(
          status,
        )
      }
      color="warning"
      size="small"
    />
  );
}

function formatDate(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString();
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}