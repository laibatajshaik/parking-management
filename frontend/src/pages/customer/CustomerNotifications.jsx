import NotificationsView from "../../components/NotificationsView.jsx";

export default function CustomerNotifications({ currentUser, loggedInUser }) {
  const user = currentUser || loggedInUser || null;
  const userEmail = user?.email || "";

  return (
    <div style={{ width: "100%" }}>
      <NotificationsView
        userEmail={userEmail}
        role="customer"
        title="Notifications & Alerts"
        subtitle="Live booking confirmations, parking bay notifications, and electronic payment receipts."
      />
    </div>
  );
}
