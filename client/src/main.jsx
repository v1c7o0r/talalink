import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "./index.css";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#196ee6" },
    background: { default: "#020817", paper: "#0f172a" },
  },
  typography: { fontFamily: "Inter, sans-serif" },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);