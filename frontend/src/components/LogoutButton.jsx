import { LogOut } from "lucide-react";

export default function LogoutButton({ onLogout }) {
  return (
    <button type="button" className="btn-logout" onClick={onLogout}>
      <LogOut size={16} />
      <span>Sign Out</span>
    </button>
  );
}
