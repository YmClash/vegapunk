import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CssBaseline
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  SmartToy as BotIcon,
  Chat as ChatIcon,
  Cable as CableIcon,
  Healing as HealingIcon,
  ShowChart as ChartIcon,
  Dashboard as DashboardIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { VegapunkTheme } from '../theme/VegapunkTheme';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const menuItems = [
  { path: '/', label: 'Home', icon: <HomeIcon />, description: 'Main Dashboard & Chat' },
  { path: '/debug', label: 'Debug Overview', icon: <DashboardIcon />, description: 'System Overview' },
  { path: '/ollama', label: 'Ollama Monitor', icon: <BotIcon />, description: 'LLM Service Status' },
  { path: '/chat-logs', label: 'Chat Logs', icon: <ChatIcon />, description: 'Message History' },
  { path: '/websockets', label: 'WebSocket Monitor', icon: <CableIcon />, description: 'Connection Tracking' },
  { path: '/errors', label: 'Error Monitor', icon: <HealingIcon />, description: 'Error Management' },
  { path: '/performance', label: 'Performance', icon: <ChartIcon />, description: 'System Metrics' },
];

export function Layout({ children, darkMode, onToggleDarkMode }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const theme = React.useMemo(
    () => darkMode ? VegapunkTheme : createTheme({ palette: { mode: 'light' } }),
    [darkMode]
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Vegapunk';
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ bgcolor: 'primary.main' }}>
        <Typography variant="h6" noWrap component="div" color="white" sx={{ fontWeight: 700 }}>
          🤖 Vegapunk
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <Tooltip title={item.description} placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.contrastText' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  secondary={item.description}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: location.pathname === item.path ? 'primary.contrastText' : 'text.secondary'
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Agentic AI System
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Phase 2: Debug Interface
        </Typography>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {getCurrentPageTitle()}
            </Typography>
            <Tooltip title="Toggle dark mode">
              <IconButton onClick={onToggleDarkMode} color="inherit">
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="View on GitHub">
              <IconButton 
                href="https://github.com/vegapunk"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}