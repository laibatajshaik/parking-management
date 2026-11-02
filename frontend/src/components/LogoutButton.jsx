import { LogOut } from "lucide-react";

export default function LogoutButton({ onLogout }) {
  return (
    <button type="button" className="pw-topbar-logout-btn" onClick={onLogout}>
      <LogOut size={16} />
      <span>Logout</span>
    </button>
  );
}
