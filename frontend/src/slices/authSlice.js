import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, access_token, refresh_token } = action.payload;
      state.user = user;
      state.accessToken = access_token;
      state.refreshToken = refresh_token;
      state.isAuthenticated = true;
    },
    updateToken: (state, action) => {
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, updateToken, setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
