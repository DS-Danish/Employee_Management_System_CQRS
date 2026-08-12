import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  approveLeave,
  getPendingLeaves,
  rejectLeave,
} from "../services/leaveService";

import {
  getLeaveTypeLabel,
  type Leave,
} from "../Types/leave";

type ReviewAction =
  | "approve"
  | "reject";

interface ReviewState {
  leave: Leave;
  action: ReviewAction;
}

export default function PendingLeavesPage():
React.ReactElement {
  const [
    leaves,
    setLeaves,
  ] = useState<Leave[]>([]);

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    processing,
    setProcessing,
  ] = useState<boolean>(false);

  const [
    review,
    setReview,
  ] = useState<ReviewState | null>(
    null,
  );

  const [
    comment,
    setComment,
  ] = useState<string>("");

  const [
    error,
    setError,
  ] = useState<string>("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string>("");

  const LEAVES_PER_BATCH = 10;

  const [
    visibleLeaveCount,
    setVisibleLeaveCount,
  ] = useState<number>(
    LEAVES_PER_BATCH,
  );

  const scrollContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const loadMoreTriggerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const displayedLeaves: Leave[] =
    leaves.slice(
      0,
      visibleLeaveCount,
    );

  const hasMoreLeaves: boolean =
    visibleLeaveCount <
    leaves.length;

  useEffect(() => {
    setVisibleLeaveCount(
      LEAVES_PER_BATCH,
    );
  }, [leaves]);

  useEffect(() => {
    const trigger:
      HTMLDivElement | null =
      loadMoreTriggerRef.current;

    if (
      !trigger ||
      !hasMoreLeaves
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

          if (
            entry?.isIntersecting
          ) {
            setVisibleLeaveCount(
              (
                currentCount:
                  number,
              ): number =>
                Math.min(
                  currentCount +
                    LEAVES_PER_BATCH,
                  leaves.length,
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
    hasMoreLeaves,
    leaves.length,
  ]);

  const loadPendingLeaves =
    useCallback(
      async (): Promise<void> => {
        setLoading(true);
        setError("");

        try {
          const result: Leave[] =
            await getPendingLeaves();

          setLeaves(result);
        } catch (
          caughtError: unknown
        ) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load pending leave requests.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadPendingLeaves();
  }, [loadPendingLeaves]);

  function openReview(
    leave: Leave,
    action: ReviewAction,
  ): void {
    setComment("");
    setError("");

    setReview({
      leave,
      action,
    });
  }

  async function handleReview():
  Promise<void> {
    if (
      !review ||
      processing
    ) {
      return;
    }

    if (
      review.action ===
        "reject" &&
      !comment.trim()
    ) {
      setError(
        "A rejection reason is required.",
      );

      return;
    }

    setProcessing(true);
    setError("");

    try {
      if (
        review.action ===
        "approve"
      ) {
        await approveLeave(
          review.leave.id,
          comment,
        );

        setSuccessMessage(
          "Leave request approved.",
        );
      } else {
        await rejectLeave(
          review.leave.id,
          comment,
        );

        setSuccessMessage(
          "Leave request rejected.",
        );
      }

      setReview(null);
      setComment("");

      await loadPendingLeaves();
    } catch (
      caughtError: unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to review leave request.",
      );
    } finally {
      setProcessing(false);
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
        <Stack spacing={3}>
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
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
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
                  }}
                >
                  Pending Leave Requests
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                  }}
                >
                  Review leave requests
                  awaiting your decision.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={
                  <RefreshIcon />
                }
                disabled={loading}
                onClick={() =>
                  void loadPendingLeaves()
                }
                sx={{
                  color:
                    "common.white",
                  borderColor:
                    "rgba(255,255,255,0.6)",
                }}
              >
                Refresh
              </Button>
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

          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor:
                "divider",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            {loading ? (
              <Box
                sx={{
                  py: 6,
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
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  No pending requests
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  There are currently no
                  leave applications waiting
                  for your review.
                </Typography>
              </Box>
            ) : (
              <Box
                ref={scrollContainerRef}
                sx={{
                  maxHeight: {
                    xs: "58vh",
                    md: "56vh",
                  },
                  overflow: "auto",
                  overscrollBehavior:
                    "contain",
                  scrollbarGutter:
                    "stable",
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
                      bgcolor:
                        "#F8FAFC",
                      p: 2,
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
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayedLeaves.map(
                      leave => (
                        <tr
                          key={
                            leave.id
                          }
                        >
                          <td>
                            {
                              leave.employeeName
                            }
                          </td>

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
                            <Chip
                              size="small"
                              color="warning"
                              label="Pending"
                            />
                          </td>

                          <td>
                            <Stack
                              direction="row"
                              spacing={1}
                            >
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={
                                  <CheckIcon />
                                }
                                onClick={() =>
                                  openReview(
                                    leave,
                                    "approve",
                                  )
                                }
                              >
                                Approve
                              </Button>

                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={
                                  <CloseIcon />
                                }
                                onClick={() =>
                                  openReview(
                                    leave,
                                    "reject",
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </Stack>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </Box>

                <Box
                  ref={loadMoreTriggerRef}
                  sx={{ height: 1 }}
                />
              </Box>
            )}
          </Paper>
        </Stack>
      </Container>

      <Dialog
        open={review !== null}
        onClose={() => {
          if (!processing) {
            setReview(null);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {review?.action ===
          "approve"
            ? "Approve Leave"
            : "Reject Leave"}
        </DialogTitle>

        <DialogContent>
          {review && (
            <Stack
              spacing={2}
              sx={{
                mt: 1,
              }}
            >
              <Typography>
                <strong>
                  Employee:
                </strong>{" "}
                {
                  review.leave
                    .employeeName
                }
              </Typography>

              <Typography>
                <strong>
                  Leave:
                </strong>{" "}
                {getLeaveTypeLabel(
                  review.leave
                    .leaveType,
                )}
              </Typography>

              <Typography>
                <strong>
                  Duration:
                </strong>{" "}
                {
                  review.leave
                    .numberOfDays
                }{" "}
                day(s)
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                required={
                    review.action === "reject"
                }
                label={
                    review.action === "reject"
                    ? "Rejection reason"
                    : "Comment (optional)"
                }
                value={comment}
                slotProps={{
                    htmlInput: {
                    maxLength: 500,
                    },
                }}
                onChange={event =>
                    setComment(
                    event.target.value,
                    )
                }
                />
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button
            disabled={processing}
            onClick={() =>
              setReview(null)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color={
              review?.action ===
              "approve"
                ? "success"
                : "error"
            }
            disabled={processing}
            onClick={() =>
              void handleReview()
            }
          >
            {processing
              ? "Processing..."
              : review?.action ===
                  "approve"
                ? "Approve"
                : "Reject"}
          </Button>
        </DialogActions>
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

function formatDate(
  value: string,
): string {
  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleDateString();
}