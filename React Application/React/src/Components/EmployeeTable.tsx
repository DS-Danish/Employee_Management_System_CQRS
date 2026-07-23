import type { ReactNode } from "react";

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
  renderActions: (employee: Employee) => ReactNode;
}

export function EmployeeTable({
  employees,
  loading,
  deletingEmployeeId,
  renderActions,
}: EmployeeTableProps) {
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
        <Typography
          variant="h6"
          sx={{ mb: 1 }}
        >
          No employees found
        </Typography>

        <Typography color="text.secondary">
          Create an employee to display it here.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width={60}>Sr. No</TableCell>
            <TableCell>Employee</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Projects</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {employees.map(
            (employee: Employee, index: number) => {
              const projectNames: string =
                employee.projects
                  ?.map(
                    (project: Project): string =>
                      project.name,
                  )
                  .join(", ") || "Not assigned";

              const departmentName: string =
                employee.department?.name ??
                employee.departmentName ??
                "Not assigned";

              const phoneNumber: string =
                employee.employeeDetail?.phoneNumber ||
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
                  <TableCell>{index + 1}</TableCell>

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

                  <TableCell>{employee.email}</TableCell>

                  <TableCell>
                    {departmentName}
                  </TableCell>

                  <TableCell>{employee.city}</TableCell>

                  <TableCell>{projectNames}</TableCell>

                  <TableCell>{phoneNumber}</TableCell>

                  <TableCell align="right">
                    {renderActions(employee)}
                  </TableCell>
                </TableRow>
              );
            },
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}