import React from "react";
import { useNavigate } from "react-router-dom";

const UnderConstruction = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff",
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <svg width="350" height="200" viewBox="0 0 600 340" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="120" y="120" width="360" height="120" rx="12" fill="#f3f0ff" stroke="#a78bfa" strokeWidth="3"/>
        <rect x="150" y="150" width="60" height="80" rx="8" fill="#a78bfa"/>
        <rect x="230" y="170" width="60" height="30" rx="6" fill="#c4b5fd"/>
        <rect x="310" y="170" width="60" height="30" rx="6" fill="#c4b5fd"/>
        <rect x="390" y="170" width="60" height="30" rx="6" fill="#c4b5fd"/>
        <rect x="230" y="210" width="220" height="10" rx="5" fill="#ede9fe"/>
        <g>
          <rect x="100" y="60" width="20" height="80" rx="5" fill="#ede9fe" stroke="#a78bfa" strokeWidth="2"/>
          <rect x="480" y="80" width="20" height="60" rx="5" fill="#ede9fe" stroke="#a78bfa" strokeWidth="2"/>
          <line x1="110" y1="60" x2="200" y2="30" stroke="#a78bfa" strokeWidth="2"/>
          <line x1="490" y1="80" x2="400" y2="30" stroke="#a78bfa" strokeWidth="2"/>
          <line x1="200" y1="30" x2="400" y2="30" stroke="#a78bfa" strokeWidth="2"/>
          <rect x="270" y="30" width="60" height="20" rx="5" fill="#a78bfa"/>
        </g>
      </svg>
      <h1 style={{ color: "#6d28d9", marginTop: 32, fontWeight: 700 }}>We're building something awesome!</h1>
      <p style={{ color: "#4b5563", fontSize: 20, margin: 8 }}>Our app is coming soon. Stay tuned!</p>
      <p style={{ color: "#6b7280", fontSize: 18, marginBottom: 32 }}>This page is under construction.</p>
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "12px 32px",
          background: "#a78bfa",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 18,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(80, 0, 200, 0.08)"
        }}
      >
        Go Back Home
      </button>
    </div>
  );
};

export default UnderConstruction; 