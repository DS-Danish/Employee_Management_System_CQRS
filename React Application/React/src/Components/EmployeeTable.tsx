import DeleteIcon from "@mui/icons-material/Delete";

import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import type { Employee } from "../Types/employee";

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  deletingEmployeeId: string | null;
  onDelete: (employee: Employee) => Promise<void>;
}

function getEmployeeName(employee: Employee): string {
  return employee.fullName?.trim() || "—";
}

function getDepartmentName(employee: Employee): string {
  return (
    employee.department?.name?.trim() ||
    employee.departmentName?.trim() ||
    "Not assigned"
  );
}

function getPhoneNumber(employee: Employee): string {
  return employee.employeeDetail?.phoneNumber?.trim() || "—";
}

function getGender(employee: Employee): string {
  return employee.employeeDetail?.gender?.trim() || "—";
}

export function EmployeeTable({
  employees,
  deletingEmployeeId,
  onDelete,
}: EmployeeTableProps) {

  if (employees.length === 0) {
    return (
      <Paper sx={{ p: 5, textAlign: "center" }}>
        <Typography color="text.secondary">
          No employees were found.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Sr. No.</strong>
            </TableCell>

            <TableCell>
              <strong>Name</strong>
            </TableCell>

            <TableCell>
              <strong>Email</strong>
            </TableCell>

            <TableCell>
              <strong>Department</strong>
            </TableCell>

            <TableCell>
              <strong>Projects</strong>
            </TableCell>

            <TableCell>
              <strong>Phone</strong>
            </TableCell>

            <TableCell>
              <strong>Gender</strong>
            </TableCell>

            <TableCell align="right">
              <strong>Actions</strong>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {employees.map(
            (employee: Employee, index: number) => {
              const isDeleting =
                deletingEmployeeId === employee.id;

              return (
                <TableRow hover key={employee.id}>
                  <TableCell>{index + 1}</TableCell>

                  <TableCell>
                    {getEmployeeName(employee)}
                  </TableCell>

                  <TableCell>
                    {employee.email ?? "—"}
                  </TableCell>

                  <TableCell>
                    {getDepartmentName(employee)}
                  </TableCell>

                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                      }}
                    >
                      {employee.projects &&
                      employee.projects.length > 0 ? (
                        employee.projects.map(
                          (project, projectIndex) => (
                            <Chip
                              key={
                                project.id ??
                                `${employee.id}-${projectIndex}`
                              }
                              label={
                                project.name ??
                                "Unnamed project"
                              }
                              size="small"
                            />
                          ),
                        )
                      ) : (
                        <Typography
                          component="span"
                          color="text.secondary"
                          variant="body2"
                        >
                          Not assigned
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    {getPhoneNumber(employee)}
                  </TableCell>

                  <TableCell>
                    {getGender(employee)}
                  </TableCell>

                  <TableCell align="right">
                    {isDeleting ? (
                      <CircularProgress size={22} />
                    ) : (
                      <Tooltip title="Delete employee">
                        <IconButton
                          aria-label={`Delete ${getEmployeeName(
                            employee,
                          )}`}
                          color="error"
                          onClick={() =>
                            void onDelete(employee)
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
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