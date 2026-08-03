import {
  useState,
  type ReactNode,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

interface StoredUser {
  fullName?: string;
  email?: string;
  role?: string;
}

interface NavigationItem {
  label: string;
  path: string;
  icon: ReactNode;
  end?: boolean;
}

const DRAWER_WIDTH = 260;

const navigationItems: NavigationItem[] = [
  {
    label: "Overview",
    path: "/team-lead/dashboard",
    icon: <DashboardIcon />,
    end: true,
  },
  {
    label: "Manage Employees",
    path: "/team-lead/employees",
    icon: <GroupsIcon />,
  },
  {
    label: "Projects",
    path: "/team-lead/projects",
    icon: <WorkIcon />,
  },
  {
    label: "My Profile",
    path: "/team-lead/profile",
    icon: <PersonIcon />,
  },
];

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
  fullName?: string,
): string {
  if (!fullName?.trim()) {
    return "TL";
  }

  const nameParts: string[] =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (nameParts.length === 1) {
    return nameParts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    nameParts[0][0] +
    nameParts[nameParts.length - 1][0]
  ).toUpperCase();
}

export function TeamLeadLayout(): React.ReactElement {
  const theme = useTheme();

  const isDesktop: boolean =
    useMediaQuery(
      theme.breakpoints.up("md"),
    );

  const navigate = useNavigate();

  const [mobileDrawerOpen, setMobileDrawerOpen] =
    useState<boolean>(false);

  const currentUser: StoredUser =
    getStoredUser();

  function handleDrawerToggle(): void {
    setMobileDrawerOpen(
      (previousValue: boolean) =>
        !previousValue,
    );
  }

  function handleNavigation(): void {
    if (!isDesktop) {
      setMobileDrawerOpen(false);
    }
  }

  function handleLogout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");

    navigate("/login", {
      replace: true,
    });
  }

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#111827",
        color: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          minHeight: 72,
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 42,
            height: 42,
            bgcolor: "primary.main",
            fontWeight: 700,
          }}
        >
          EMS
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Employee System
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color:
                "rgba(255,255,255,0.65)",
            }}
          >
            Team Lead Portal
          </Typography>
        </Box>
      </Box>

      <Divider
        sx={{
          borderColor:
            "rgba(255,255,255,0.10)",
        }}
      />

      <List
        component="nav"
        sx={{
          px: 1.5,
          py: 2,
        }}
      >
        {navigationItems.map(
          (item: NavigationItem) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.end}
              onClick={handleNavigation}
              sx={{
                mb: 0.75,
                px: 1.5,
                py: 1.15,
                borderRadius: 2,
                color:
                  "rgba(255,255,255,0.72)",

                "& .MuiListItemIcon-root": {
                  minWidth: 40,
                  color: "inherit",
                },

                "&:hover": {
                  bgcolor:
                    "rgba(255,255,255,0.08)",
                  color: "#FFFFFF",
                },

                "&.active": {
                  bgcolor: "primary.main",
                  color:
                    "primary.contrastText",
                },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>

              <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: 600,
                      },
                    },
                  }}
                />
            </ListItemButton>
          ),
        )}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider
        sx={{
          borderColor:
            "rgba(255,255,255,0.10)",
        }}
      />

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: 1,
            mb: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor:
                "rgba(255,255,255,0.14)",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {getInitials(
              currentUser.fullName,
            )}
          </Avatar>

          <Box
            sx={{
              minWidth: 0,
              flexGrow: 1,
            }}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: "#FFFFFF",
                fontWeight: 600,
              }}
            >
              {currentUser.fullName ??
                "Team Lead"}
            </Typography>

            <Typography
              variant="caption"
              noWrap
              sx={{
                display: "block",
                color:
                  "rgba(255,255,255,0.60)",
              }}
            >
              {currentUser.email ?? ""}
            </Typography>
          </Box>
        </Box>

        <Button
          type="button"
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            borderColor:
              "rgba(255,255,255,0.22)",
            color: "#FFFFFF",
            borderRadius: 2,
            textTransform: "none",

            "&:hover": {
              borderColor:
                "rgba(255,255,255,0.45)",
              bgcolor:
                "rgba(255,255,255,0.08)",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#F8FAFC",
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: {
            xs: "block",
            md: "none",
          },
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <IconButton
            type="button"
            edge="start"
            aria-label="Open navigation"
            onClick={handleDrawerToggle}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              flexGrow: 1,
            }}
          >
            Team Lead
          </Typography>

          <Tooltip
            title={
              currentUser.fullName ??
              "Team Lead"
            }
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "primary.main",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {getInitials(
                currentUser.fullName,
              )}
            </Avatar>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        aria-label="Team Lead navigation"
        sx={{
          width: {
            md: DRAWER_WIDTH,
          },
          flexShrink: {
            md: 0,
          },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            display: {
              xs: "block",
              md: "none",
            },

            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              border: 0,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: {
              xs: "none",
              md: "block",
            },

            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              border: 0,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          pt: {
            xs: "64px",
            md: 0,
          },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}