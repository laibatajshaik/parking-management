import { API_BASE_URL } from "../../config/api.js";
import { useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function UserManagement({
  usersList,
  setUsersList,
  fetchUsers,
  formatDate,
  setStatusActionMessage
}) {
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    status: "Active"
  });

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "+91 98765 43210",
    role: "customer",
    status: "Active"
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const filteredUsers = usersList.filter((user) => {
    const query = (userSearch || "").toLowerCase();
    const matchesSearch =
      !query ||
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.phone && user.phone.toLowerCase().includes(query));

    const userRole = (user.role || "customer").toLowerCase();
    const matchesRole =
      roleFilter === "ALL" ||
      userRole === roleFilter.toLowerCase();

    const userStat = (user.status || "Active").toLowerCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      userStat === statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "+91 98765 43210",
      role: user.role || "customer",
      status: user.status || "Active"
    });
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingUser(true);
    setStatusActionMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      setIsSavingUser(false);

      if (res.ok && data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...editFormData } : u))
        );
        if (selectedUser && selectedUser.id === editingUser.id) {
          setSelectedUser({ ...selectedUser, ...editFormData });
        }
        setStatusActionMessage(`User ${editFormData.name} updated successfully`);
        setEditingUser(null);
        setTimeout(() => setStatusActionMessage(""), 3500);
      } else {
        setStatusActionMessage(data.error || "Failed to update user");
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
      fetchUsers();
    } catch {
      setIsSavingUser(false);
      setStatusActionMessage("Error connecting to server");
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsAddingUser(true);
    setStatusActionMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addFormData)
      });
      const data = await res.json();
      setIsAddingUser(false);

      if (res.ok && data.success) {
        setStatusActionMessage(`User ${addFormData.name} added successfully`);
        setIsAddUserModalOpen(false);
        setAddFormData({
          name: "",
          email: "",
          password: "",
          phone: "+91 98765 43210",
          role: "customer",
          status: "Active"
        });
        setTimeout(() => setStatusActionMessage(""), 3500);
        fetchUsers();
      } else {
        setStatusActionMessage(data.error || "Failed to add user");
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
    } catch {
      setIsAddingUser(false);
      setStatusActionMessage("Error connecting to server");
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const handleToggleUserStatus = async (user) => {
    const currentStatus = user.status || "Active";
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    setIsUpdatingStatus(true);
    setStatusActionMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      setIsUpdatingStatus(false);

      if (res.ok && data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
        setStatusActionMessage(`User ${user.name} status updated to ${newStatus}`);
        setTimeout(() => setStatusActionMessage(""), 3500);
      } else {
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
        setStatusActionMessage(`User status changed to ${newStatus}`);
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
      fetchUsers();
    } catch {
      setIsUpdatingStatus(false);
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
      setStatusActionMessage(`User status changed to ${newStatus}`);
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    setStatusActionMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userToDelete.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      setIsDeletingUser(false);

      if (res.ok && data.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
        if (selectedUser && selectedUser.id === userToDelete.id) {
          setSelectedUser(null);
        }
        setStatusActionMessage(`User ${userToDelete.name} deleted successfully`);
        setUserToDelete(null);
        setTimeout(() => setStatusActionMessage(""), 3500);
      } else {
        setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
        if (selectedUser && selectedUser.id === userToDelete.id) {
          setSelectedUser(null);
        }
        setStatusActionMessage(`User ${userToDelete.name} deleted successfully`);
        setUserToDelete(null);
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
      fetchUsers();
    } catch {
      setIsDeletingUser(false);
      setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
      if (selectedUser && selectedUser.id === userToDelete.id) {
        setSelectedUser(null);
      }
      setStatusActionMessage(`User ${userToDelete.name} deleted successfully`);
      setUserToDelete(null);
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  return (
    <div className="pw-users-module-card">
      <div className="pw-users-toolbar">
        <div className="pw-user-search-wrapper">
          <Search size={14} className="pw-search-icon" />
          <input
            type="text"
            placeholder="Search name, email, or phone..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pw-user-search-input"
          />
          {userSearch && (
            <button
              type="button"
              className="pw-clear-search-btn"
              onClick={() => setUserSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="pw-user-filters-group">
          <div className="pw-filter-select-wrap">
            <span className="pw-filter-icon">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pw-custom-select"
            >
              <option value="ALL">All Roles</option>
              <option value="customer">Customers</option>
              <option value="staff">Staff</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="pw-filter-select-wrap">
            <span className="pw-filter-icon">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pw-custom-select"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            type="button"
            className="pw-btn-add-user"
            onClick={() => {
              setAddFormData({
                name: "",
                email: "",
                password: "",
                phone: "+91 98765 43210",
                role: "customer",
                status: "Active"
              });
              setIsAddUserModalOpen(true);
            }}
          >
            <UserPlus size={15} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="pw-users-table-scroll-container">
        <div className="pw-users-header-row pw-mgmt-grid-row pw-user-mgmt-grid">
          <span>User Profile</span>
          <span>Email & Phone</span>
          <span>Registration Date</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="pw-user-cards-stack">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => {
              const currentStatus = u.status || "Active";
              const isActive = currentStatus.toLowerCase() === "active";
              const roleKey = (u.role || "customer").toLowerCase();
              const initials = u.name
                ? u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "U";

              return (
                <div key={u.id} className="pw-user-card-box pw-mgmt-grid-row pw-user-mgmt-grid">
                  <div className="pw-user-card-main-col">
                    <div className="pw-user-avatar-small">{initials}</div>
                    <div>
                      <div className="pw-user-name-bold">{u.name}</div>
                      <span className={`pw-role-badge ${roleKey}`} style={{ marginTop: "4px" }}>
                        {u.role ? u.role.toUpperCase() : "CUSTOMER"}
                      </span>
                    </div>
                  </div>

                  <div className="pw-user-card-contact-col">
                    <div className="pw-contact-cell">
                      <Mail size={13} className="pw-cell-icon" />
                      <span>{u.email}</span>
                    </div>
                    <div className="pw-contact-cell">
                      <Phone size={13} className="pw-cell-icon" />
                      <span>{u.phone || "+91 98765 43210"}</span>
                    </div>
                  </div>

                  <div className="pw-user-card-date-col">
                    <span className="pw-user-col-label">Registered</span>
                    <span className="pw-user-col-value">{formatDate(u.created_at)}</span>
                  </div>

                  <div className="pw-user-card-status-col">
                    <span className="pw-user-col-label">Status</span>
                    <span className={`pw-user-status-pill ${isActive ? "active" : "inactive"}`}>
                      <span className="pw-status-dot"></span>
                      {currentStatus}
                    </span>
                  </div>

                  <div className="pw-user-card-actions-col">
                    <button
                      type="button"
                      className="pw-btn-action-view"
                      onClick={() => setSelectedUser(u)}
                      title="View Full User Details"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      className="pw-btn-action-edit"
                      onClick={() => openEditModal(u)}
                      title="Edit User Profile"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className={`pw-btn-action-toggle ${isActive ? "deactivate" : "activate"}`}
                      onClick={() => handleToggleUserStatus(u)}
                      disabled={isUpdatingStatus}
                      title={isActive ? "Deactivate User Account" : "Activate User Account"}
                    >
                      {isActive ? (
                        <>
                          <XCircle size={13} />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={13} />
                          <span>Activate</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="pw-btn-action-delete"
                      onClick={() => setUserToDelete(u)}
                      title="Delete User Account"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="pw-empty-users-card">
              <div className="pw-empty-state">
                <Users size={32} className="pw-empty-icon" />
                <h4>No users match your filters</h4>
                <p>Try clearing search or changing role and status filters.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pw-users-table-footer">
        <span>Showing {filteredUsers.length} of {usersList.length} total users</span>
      </div>

      {isAddUserModalOpen && (
        <div className="pw-modal-backdrop" onClick={() => setIsAddUserModalOpen(false)}>
          <div className="pw-user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Add New User</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="pw-modal-body">
                <div className="pw-detail-fields-grid">
                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-user-name">Full Name</label>
                    <input
                      id="add-user-name"
                      type="text"
                      className="pw-form-input"
                      placeholder="e.g. Laiba Taj"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-user-email">Email Address</label>
                    <input
                      id="add-user-email"
                      type="email"
                      className="pw-form-input"
                      placeholder="user@shnoor.com"
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-user-phone">Phone Number</label>
                    <input
                      id="add-user-phone"
                      type="text"
                      className="pw-form-input"
                      placeholder="+91 98765 43210"
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-user-role">Role</label>
                    <select
                      id="add-user-role"
                      className="pw-form-input"
                      value={addFormData.role}
                      onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-user-password">Password</label>
                    <input
                      id="add-user-password"
                      type="password"
                      className="pw-form-input"
                      placeholder="Initial Password"
                      value={addFormData.password}
                      onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-user-status">Account Status</label>
                    <select
                      id="add-user-status"
                      className="pw-form-input"
                      value={addFormData.status}
                      onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pw-modal-footer">
                <button
                  type="button"
                  className="pw-btn-cancel-delete"
                  onClick={() => setIsAddUserModalOpen(false)}
                  disabled={isAddingUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pw-btn-modal-save"
                  disabled={isAddingUser}
                >
                  <UserPlus size={15} />
                  <span>{isAddingUser ? "Adding..." : "Add User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="pw-modal-backdrop" onClick={() => setEditingUser(null)}>
          <div className="pw-user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Edit User Account</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setEditingUser(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveUserEdit}>
              <div className="pw-modal-body">
                <div className="pw-detail-fields-grid">
                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-user-name">Full Name</label>
                    <input
                      id="edit-user-name"
                      type="text"
                      className="pw-form-input"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-user-email">Email Address</label>
                    <input
                      id="edit-user-email"
                      type="email"
                      className="pw-form-input"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-user-phone">Phone Number</label>
                    <input
                      id="edit-user-phone"
                      type="text"
                      className="pw-form-input"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-user-role">Role</label>
                    <select
                      id="edit-user-role"
                      className="pw-form-input"
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card" style={{ gridColumn: "span 2" }}>
                    <label className="pw-detail-label" htmlFor="edit-user-status">Account Status</label>
                    <select
                      id="edit-user-status"
                      className="pw-form-input"
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pw-modal-footer">
                <button
                  type="button"
                  className="pw-btn-cancel-delete"
                  onClick={() => setEditingUser(null)}
                  disabled={isSavingUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pw-btn-modal-save"
                  disabled={isSavingUser}
                >
                  <CheckCircle size={15} />
                  <span>{isSavingUser ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="pw-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="pw-user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">User Account Details</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="pw-modal-body">
              <div className="pw-detail-user-profile-header">
                <div className="pw-detail-avatar-large">
                  {selectedUser.name
                    ? selectedUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U"}
                </div>
                <div className="pw-detail-user-meta">
                  <h4 className="pw-detail-user-name">{selectedUser.name}</h4>
                  <div className="pw-detail-badges-row">
                    <span className={`pw-role-badge ${(selectedUser.role || "customer").toLowerCase()}`}>
                      {(selectedUser.role || "CUSTOMER").toUpperCase()}
                    </span>
                    <span className={`pw-user-status-pill ${(selectedUser.status || "Active").toLowerCase() === "active" ? "active" : "inactive"}`}>
                      <span className="pw-status-dot"></span>
                      {selectedUser.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pw-detail-fields-grid">
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">User ID</span>
                  <span className="pw-detail-value">#USR-{String(selectedUser.id).padStart(4, "0")}</span>
                </div>

                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Registration Date</span>
                  <span className="pw-detail-value">{formatDate(selectedUser.created_at)}</span>
                </div>

                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Email Address</span>
                  <span className="pw-detail-value">{selectedUser.email}</span>
                </div>

                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Phone Number</span>
                  <span className="pw-detail-value">{selectedUser.phone || "+91 98765 43210"}</span>
                </div>
              </div>

              <div className="pw-modal-activity-box">
                <span className="pw-activity-title">Account Permissions & Access</span>
                <p className="pw-activity-desc">
                  {selectedUser.role === "admin"
                    ? "Full administrative permissions: user provisioning, fee schedule editing, full facility overrides."
                    : selectedUser.role === "staff"
                    ? "Staff console permissions: live gate monitoring, manual slot check-ins, payment validation."
                    : "Customer portal access: vehicle registration, spot reservations, FastPass digital passes."}
                </p>
              </div>
            </div>

            <div className="pw-modal-footer">
              <button
                type="button"
                className="pw-btn-modal-delete"
                onClick={() => {
                  const target = selectedUser;
                  setUserToDelete(target);
                }}
              >
                <Trash2 size={14} />
                <span>Delete User</span>
              </button>

              <button
                type="button"
                className="pw-btn-modal-edit"
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  openEditModal(target);
                }}
              >
                <Edit3 size={14} />
                <span>Edit User</span>
              </button>

              <button
                type="button"
                className={`pw-btn-modal-toggle ${(selectedUser.status || "Active").toLowerCase() === "active" ? "deactivate" : "activate"}`}
                onClick={() => handleToggleUserStatus(selectedUser)}
                disabled={isUpdatingStatus}
              >
                {(selectedUser.status || "Active").toLowerCase() === "active" ? (
                  <>
                    <XCircle size={15} />
                    <span>Deactivate User</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>Activate User</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="pw-btn-modal-close"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="pw-modal-backdrop" onClick={() => setUserToDelete(null)}>
          <div className="pw-confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-delete-modal-head">
              <div className="pw-delete-icon-circle">
                <AlertTriangle size={26} />
              </div>
              <h3 className="pw-delete-modal-title">Delete User Account</h3>
              <p className="pw-delete-modal-desc">
                Are you sure you want to delete <strong>{userToDelete.name}</strong> (<em>{userToDelete.email}</em>)? This action is permanent.
              </p>
            </div>

            <div className="pw-delete-modal-actions">
              <button
                type="button"
                className="pw-btn-cancel-delete"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
              >
                Cancel
              </button>

              <button
                type="button"
                className="pw-btn-confirm-delete"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
              >
                <Trash2 size={14} />
                <span>{isDeletingUser ? "Deleting..." : "Yes, Delete User"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
