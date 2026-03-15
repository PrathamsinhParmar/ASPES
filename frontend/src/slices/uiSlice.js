import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    theme: 'dark',
    notifications: [],
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (state.notifications.length > 50) state.notifications.pop();
    },
    markNotificationRead: (state, action) => {
      const n = state.notifications.find(n => n.id === action.payload);
      if (n) n.read = true;
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  markNotificationRead,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
