import React from "react";

export default function WelcomeCard({ username }) {
  const name = username || localStorage.getItem("username") || "User";
  return (
    <div style={{ padding: 12 }}>
      <h2>Welcome{ name ? `, ${name}` : '' }!</h2>
    </div>
  );
}