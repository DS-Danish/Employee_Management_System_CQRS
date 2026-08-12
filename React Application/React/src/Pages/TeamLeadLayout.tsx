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
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupsIcon from "@mui/icons-material/Groups";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
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

import type {
  StoredUser,
} from "../Types/auth";

interface NavigationItem {
  label: string;
  path: string;
  icon: ReactNode;
  end?: boolean;
}

const DRAWER_WIDTH = 260;

const navigationItems:
  NavigationItem[] = [
    {
      label: "Overview",
      path:
        "/team-lead/dashboard",
      icon:
        <DashboardIcon />,
      end: true,
    },
    {
      label: "Employees",
      path:
        "/team-lead/employees",
      icon:
        <GroupsIcon />,
    },
    {
      label: "My Leaves",
      path:
        "/team-lead/leaves",
      icon:
        <EventAvailableIcon />,
    },
    {
      label: "Leave Requests",
      path:
        "/team-lead/leave-requests",
      icon:
        <PendingActionsIcon />,
    },
    {
      label: "Projects",
      path:
        "/team-lead/projects",
      icon:
        <WorkIcon />,
    },
    {
      label: "Permissions",
      path:
        "/team-lead/permissions",
      icon:
        <SecurityIcon />,
    },
    {
      label: "My Profile",
      path:
        "/team-lead/profile",
      icon:
        <PersonIcon />,
    },
  ];

export function TeamLeadLayout():
React.ReactElement {
  const theme = useTheme();

  const isDesktop: boolean =
    useMediaQuery(
      theme.breakpoints.up(
        "md",
      ),
    );

  const navigate =
    useNavigate();

  const [
    mobileDrawerOpen,
    setMobileDrawerOpen,
  ] =
    useState<boolean>(
      false,
    );

  const currentUser:
    StoredUser | null =
    getStoredUser();

  function handleDrawerToggle():
  void {
    setMobileDrawerOpen(
      (
        previousValue:
          boolean,
      ) =>
        !previousValue,
    );
  }

  function handleNavigation():
  void {
    if (!isDesktop) {
      setMobileDrawerOpen(
        false,
      );
    }
  }

  function handleLogout():
  void {
    localStorage.removeItem(
      "authToken",
    );

    localStorage.removeItem(
      "authUser",
    );

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }

  const drawerContent:
    React.ReactElement = (
    <Box
      sx={{
        height: "100%",

        display: "flex",

        flexDirection:
          "column",

        bgcolor:
          "#111827",

        color:
          "#FFFFFF",
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          minHeight: 72,
          px: 2.5,
          py: 2,

          display:
            "flex",

          alignItems:
            "center",

          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 42,
            height: 42,

            bgcolor:
              "primary.main",

            fontWeight:
              700,
          }}
        >
          EMS
        </Avatar>

        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight:
                700,

              lineHeight:
                1.2,
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

      {/* NAVIGATION */}

      <List
        component="nav"
        sx={{
          px: 1.5,
          py: 2,
        }}
      >
        {navigationItems.map(
          (
            item:
              NavigationItem,
          ) => (
            <ListItemButton
              key={
                item.path
              }
              component={
                NavLink
              }
              to={
                item.path
              }
              end={
                item.end
              }
              onClick={
                handleNavigation
              }
              sx={{
                mb: 0.75,
                px: 1.5,
                py: 1.15,
                borderRadius: 2,

                color:
                  "rgba(255,255,255,0.72)",

                "& .MuiListItemIcon-root":
                  {
                    minWidth:
                      40,

                    color:
                      "inherit",
                  },

                "&:hover":
                  {
                    bgcolor:
                      "rgba(255,255,255,0.08)",

                    color:
                      "#FFFFFF",
                  },

                "&.active":
                  {
                    bgcolor:
                      "primary.main",

                    color:
                      "primary.contrastText",
                  },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={
                  item.label
                }
                slotProps={{
                  primary:
                    {
                      sx: {
                        fontSize:
                          14,

                        fontWeight:
                          600,
                      },
                    },
                }}
              />
            </ListItemButton>
          ),
        )}
      </List>

      <Box
        sx={{
          flexGrow: 1,
        }}
      />

      <Divider
        sx={{
          borderColor:
            "rgba(255,255,255,0.10)",
        }}
      />

      {/* USER */}

      <Box
        sx={{
          p: 2,
        }}
      >
        <Button
          type="button"
          fullWidth
          variant="outlined"
          startIcon={
            <LogoutIcon />
          }
          onClick={
            handleLogout
          }
          sx={{
            borderColor:
              "rgba(255,255,255,0.22)",

            color:
              "#FFFFFF",

            borderRadius: 2,

            textTransform:
              "none",

            "&:hover":
              {
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
        display:
          "flex",

        minHeight:
          "100vh",

        bgcolor:
          "#F8FAFC",
      }}
    >
      {/* MOBILE APP BAR */}

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: {
            xs: "block",
            md: "none",
          },

          bgcolor:
            "background.paper",

          color:
            "text.primary",

          borderBottom:
            "1px solid",

          borderColor:
            "divider",
        }}
      >
        <Toolbar>
          <IconButton
            type="button"
            edge="start"
            aria-label="Open navigation"
            onClick={
              handleDrawerToggle
            }
            sx={{
              mr: 1,
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              fontWeight:
                700,

              flexGrow: 1,
            }}
          >
            Super Admin
          </Typography>

          <Tooltip
            title={
              currentUser
                ?.fullName ??
              "Team Lead"
            }
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,

                bgcolor:
                  "primary.main",

                fontSize:
                  13,

                fontWeight:
                  700,
              }}
            >
              {getInitials(
                currentUser
                  ?.fullName,
              )}
            </Avatar>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* NAVIGATION DRAWER */}

      <Box
        component="nav"
        aria-label="Team Lead navigation"
        sx={{
          width: {
            md:
              DRAWER_WIDTH,
          },

          flexShrink:
            {
              md: 0,
            },
        }}
      >
        <Drawer
          variant="temporary"
          open={
            mobileDrawerOpen
          }
          onClose={
            handleDrawerToggle
          }
          sx={{
            display: {
              xs: "block",
              md: "none",
            },

            "& .MuiDrawer-paper":
              {
                width:
                  DRAWER_WIDTH,

                boxSizing:
                  "border-box",

                border:
                  0,
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

            "& .MuiDrawer-paper":
              {
                width:
                  DRAWER_WIDTH,

                boxSizing:
                  "border-box",

                border:
                  0,
              },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* PAGE CONTENT */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,

          minWidth: 0,

          pt: {
            xs:
              "64px",

            md: 0,
          },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

function getStoredUser():
StoredUser | null {
  const storedUserJson:
    | string
    | null =
    localStorage.getItem(
      "authUser",
    );

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
}

function getInitials(
  fullName?: string,
): string {
  if (!fullName?.trim()) {
    return "TL";
  }

  const nameParts:
    string[] =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    nameParts.length ===
    1
  ) {
    return nameParts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    nameParts[0][0] +
    nameParts[
      nameParts.length -
        1
    ][0]
  ).toUpperCase();
}