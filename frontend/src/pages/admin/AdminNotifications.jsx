import NotificationsView from "../../components/NotificationsView.jsx";

export default function AdminNotifications({ currentUser }) {
  const userEmail = currentUser?.email || "admin@shnoor.com";

  return (
    <div style={{ width: "100%" }}>
      <NotificationsView
        userEmail={userEmail}
        role="admin"
        title="Notifications"
        subtitle="System-wide audit notifications, revenue milestones, capacity alerts, and user registrations."
      />
    </div>
  );
}
