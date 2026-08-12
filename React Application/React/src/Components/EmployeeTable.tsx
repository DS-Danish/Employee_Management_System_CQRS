import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { Employee } from "../Types/employee";
import type { Project } from "../Types/project";

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  deletingEmployeeId: string | null;
  renderActions?: (employee: Employee) => ReactNode;
}

export function EmployeeTable({
  employees,
  loading,
  deletingEmployeeId,
  renderActions,
}: EmployeeTableProps): ReactElement {
  const ROWS_PER_BATCH = 10;

  const [visibleEmployeeCount, setVisibleEmployeeCount] =
    useState<number>(ROWS_PER_BATCH);

  const scrollContainerRef =
    useRef<HTMLDivElement | null>(null);

  const loadMoreTriggerRef =
    useRef<HTMLDivElement | null>(null);

  const displayedEmployees: Employee[] =
    employees.slice(
      0,
      visibleEmployeeCount,
    );

  const hasMoreEmployees: boolean =
    visibleEmployeeCount <
    employees.length;

  useEffect(() => {
    setVisibleEmployeeCount(
      ROWS_PER_BATCH,
    );
  }, [employees]);

  useEffect(() => {
    const trigger: HTMLDivElement | null =
      loadMoreTriggerRef.current;

    if (!trigger || !hasMoreEmployees) {
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
            setVisibleEmployeeCount(
              (
                currentCount:
                  number,
              ): number =>
                Math.min(
                  currentCount +
                    ROWS_PER_BATCH,
                  employees.length,
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
    employees.length,
    hasMoreEmployees,
  ]);

  if (loading) {
    return (
      <Paper
        variant="outlined"
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          minHeight: 250,
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (employees.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 5,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          No employees found
        </Typography>

        <Typography color="text.secondary">
          No employee records are available.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      ref={scrollContainerRef}
      component={Paper}
      sx={{
        maxHeight: {
          xs: "58vh",
          md: "56vh",
        },
        overflowY: "auto",
        overscrollBehavior: "contain",
        scrollbarGutter: "stable",
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Sr. No</TableCell>
            <TableCell>Employee</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Projects</TableCell>
            <TableCell>Phone</TableCell>

            {renderActions && (
              <TableCell align="right">
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {displayedEmployees.map(
            (
              employee: Employee,
              index: number,
            ): ReactElement => {
              const projectNames: string =
                employee.projects
                  ?.map(
                    (
                      project: Project,
                    ): string => project.name,
                  )
                  .join(", ") ?? "Not assigned";

              const departmentName: string =
                employee.department?.name ??
                employee.departmentName ??
                "Not assigned";

              const phoneNumber: string =
                employee.employeeDetail?.phoneNumber ??
                "Not provided";

              return (
                <TableRow
                  key={employee.id}
                  hover
                  sx={{
                    opacity:
                      deletingEmployeeId === employee.id
                        ? 0.5
                        : 1,
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: 0.4,
                      }}
                    >
                      {String(index + 1).padStart(3, "0")}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                      >
                        {employee.fullName}
                      </Typography>

                      {employee.employeeDetail?.cnic && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {employee.employeeDetail.cnic}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    {employee.email}
                  </TableCell>

                  <TableCell>
                    {departmentName}
                  </TableCell>

                  <TableCell>
                    {employee.city}
                  </TableCell>

                  <TableCell>
                    {projectNames}
                  </TableCell>

                  <TableCell>
                    {phoneNumber}
                  </TableCell>

                  {renderActions && (
                    <TableCell align="right">
                      {renderActions(employee)}
                    </TableCell>
                  )}
                </TableRow>
              );
            },
          )}
        </TableBody>
      </Table>

      <Box
        ref={loadMoreTriggerRef}
        sx={{ height: 1 }}
      />
    </TableContainer>
  );
}