import NotificationsView from "../../components/NotificationsView.jsx";

export default function StaffNotifications({ currentUser }) {
  const userEmail = currentUser?.email || "";

  return (
    <div style={{ width: "100%" }}>
      <NotificationsView
        userEmail={userEmail}
        role="staff"
        title="Notifications"
        subtitle="Real-time alerts for vehicle entries, bay checkouts, reservation arrivals, and gate operations."
      />
    </div>
  );
}
