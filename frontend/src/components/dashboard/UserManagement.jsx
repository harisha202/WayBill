import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/services/adminApi';
import { useApi } from '../../api/hooks/useApi';
import { StateBoundary } from '../common/StateBoundary';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'reset_password'
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'manufacturer',
    company_name: '',
    phone: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getUsers();
      setUsers(Array.isArray(response) ? response : (response?.data || []));
    } catch (err) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      full_name: '',
      username: '',
      email: '',
      password: '',
      role: 'manufacturer',
      company_name: '',
      phone: ''
    });
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      full_name: user.name || '',
      username: user.username,
      email: user.email,
      role: user.role,
      company_name: user.company_name || '',
      phone: user.phone || ''
    });
    setIsModalOpen(true);
  };

  const openResetPasswordModal = (user) => {
    setModalMode('reset_password');
    setSelectedUser(user);
    setFormData({ ...formData, password: '' });
    setOtp('');
    setOtpSent(false);
    setIsModalOpen(true);
  };

  const handleSendOtp = async () => {
    setIsSubmitting(true);
    try {
      await adminApi.sendPasswordResetOtp(selectedUser.id);
      setOtpSent(true);
      setSuccessMessage('OTP sent to registered email.');
    } catch(err) {
      alert(err.response?.data?.detail || err.message || 'Failed to send OTP.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const openViewModal = (user) => {
    setModalMode('view');
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you absolutely sure you want to PERMANENTLY delete user '${user.username}'? This cannot be undone.`)) {
      try {
        await adminApi.deleteUser(user.id);
        setSuccessMessage('User deleted successfully.');
        window.dispatchEvent(new Event('activity_log_changed'));
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.detail || err.message || 'Failed to delete user.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    if (window.confirm(`Are you absolutely sure you want to PERMANENTLY delete ${selectedUsers.size} user(s)? This cannot be undone.`)) {
      try {
        for (const userId of selectedUsers) {
          await adminApi.deleteUser(userId);
        }
        setSuccessMessage(`${selectedUsers.size} user(s) deleted successfully.`);
        setSelectedUsers(new Set());
        window.dispatchEvent(new Event('activity_log_changed'));
        fetchUsers();
      } catch (err) {
        alert('Failed to delete some users. ' + (err.response?.data?.detail || err.message));
        fetchUsers();
      }
    }
  };

  const toggleSelectAll = (filteredList) => {
    if (selectedUsers.size === filteredList.length && filteredList.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredList.map(u => u.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUsers(newSet);
  };

  const handleToggleStatus = async (user) => {
    if (window.confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this account?`)) {
      try {
        await adminApi.updateUserStatus(user.id, user.is_active ? 0 : 1);
        window.dispatchEvent(new Event('activity_log_changed'));
        fetchUsers();
      } catch (err) {
        alert('Failed to update status: ' + err.message);
      }
    }
  };

  const isCompanyRequired = (role) => {
    return true; // All roles require a company name for WayBill Normal Login
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      if (modalMode === 'create') {
        await adminApi.createUser(formData);
        setSuccessMessage('User created successfully.');
        setSearch('');
        setRoleFilter('All');
        setStatusFilter('All');
      } else if (modalMode === 'edit') {
        await adminApi.updateUser(selectedUser.id, formData);
        setSuccessMessage('User updated successfully.');
      } else if (modalMode === 'reset_password') {
        await adminApi.resetUserPassword(selectedUser.id, otp, formData.password);
        setSuccessMessage('Password reset successfully.');
      }
      window.dispatchEvent(new Event('activity_log_changed'));
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.username + u.name + (u.company_name || '')).toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' && u.is_active) || (statusFilter === 'Inactive' && !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="card-title">User Management</h2>
          <p className="muted">Manage authorized WayBill operational accounts.</p>
        </div>
        <div>
          {selectedUsers.size > 0 && (
            <button className="primary-btn" style={{ marginRight: '1rem', backgroundColor: '#ef4444' }} onClick={handleBulkDelete}>
              Delete Selected ({selectedUsers.size})
            </button>
          )}
          <button className="primary-btn" onClick={openCreateModal}>+ Create User</button>
        </div>
      </div>

      {successMessage && <div style={{ padding: '1rem', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #c3e6cb' }}>{successMessage}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input 
          type="text" 
          aria-label="Search users"
          placeholder="Search username, name, company..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'var(--card-bg)', color: '#fff' }}
        />
        <select aria-label="Filter by role" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--card-bg)', color: '#fff' }}>
          <option value="All">All Roles</option>
          <option value="manufacturer">Manufacturer</option>
          <option value="transporter">Transporter</option>
          <option value="dealer">Dealer</option>
          <option value="retail_shop">Retail</option>
        </select>
        <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--card-bg)', color: '#fff' }}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <StateBoundary state={{ loading, error, isEmpty: filteredUsers.length === 0 }} onRetry={fetchUsers} emptyMessage="No users found.">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ padding: '0.75rem', width: '40px' }}>
                <input type="checkbox" aria-label="Select all users" checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0} onChange={() => toggleSelectAll(filteredUsers)} style={{ cursor: 'pointer' }} />
              </th>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Last Login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[...filteredUsers].reverse().map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '0.75rem' }}>
                  <input type="checkbox" aria-label={`Select user ${user.username}`} checked={selectedUsers.has(user.id)} onChange={() => toggleSelect(user.id)} style={{ cursor: 'pointer' }} />
                </td>
                <td>{user.name}</td>
                <td>{user.username}</td>
                <td>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#333', color: '#ffffff' }}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td>{user.company_name || '-'}</td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    backgroundColor: user.is_active ? '#2e7d32' : '#c62828',
                    color: '#ffffff'
                  }}>
                    {user.is_active ? '● ACTIVE' : '● INACTIVE'}
                  </span>
                </td>
                <td className="muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : (
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#c62828', color: '#ffffff', display: 'inline-block' }}>
                      ● NEVER
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="secondary-btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', borderRadius: '4px', marginRight: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }} onClick={() => openViewModal(user)}>View</button>
                  <button className="secondary-btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', borderRadius: '4px', marginRight: '0.5rem', backgroundColor: '#f59e0b', color: '#ffffff', border: 'none' }} onClick={() => openEditModal(user)}>Edit</button>
                  <button className="secondary-btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', borderRadius: '4px', marginRight: '0.5rem', backgroundColor: user.is_active ? '#64748b' : '#10b981', color: '#ffffff', border: 'none' }} onClick={() => handleToggleStatus(user)}>
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="secondary-btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', borderRadius: '4px', marginRight: '0.5rem', backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none' }} onClick={() => openResetPasswordModal(user)}>Reset Pwd</button>
                  <button className="secondary-btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', borderRadius: '4px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} onClick={() => handleDeleteUser(user)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </StateBoundary>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: modalMode === 'view' ? '600px' : '400px', maxWidth: '90vw', backgroundColor: '#ffffff', color: '#000000', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, color: '#000000' }}>
              {modalMode === 'create' && 'Create User'}
              {modalMode === 'edit' && 'Edit User'}
              {modalMode === 'reset_password' && 'Reset Password'}
              {modalMode === 'view' && 'View User Details'}
            </h3>
            
            {modalMode === 'view' && selectedUser ? (
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                <p><strong>ID:</strong> {selectedUser.id}</p>
                <p><strong>Username:</strong> {selectedUser.username}</p>
                <p><strong>Full Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role.toUpperCase()}</p>
                <p><strong>Company:</strong> {selectedUser.company_name || '-'}</p>
                <p><strong>Phone:</strong> {selectedUser.phone || '-'}</p>
                <p><strong>Status:</strong> {selectedUser.is_active ? 'Active' : 'Inactive'}</p>
                <p><strong>Created At:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
                <p><strong>Last Login:</strong> {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString() : 'Never'}</p>
                
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #ccc' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Activity History</h4>
                  <UserActivityHistory userId={selectedUser.id} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button className="primary-btn" onClick={() => setIsModalOpen(false)}>Close</button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {modalMode !== 'reset_password' && (
                <>
                  <input id="user-fullname" name="full_name" type="text" placeholder="Full Name" aria-label="Full Name" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={inputStyle} />
                  <input id="user-username" name="username" type="text" placeholder="Username" aria-label="Username" required disabled={modalMode === 'edit'} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={inputStyle} />
                  {modalMode === 'create' && (
                    <input id="user-email" name="emailaddress" type="email" placeholder="Email" aria-label="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
                  )}
                  <select id="user-role" name="role" aria-label="Role" value={formData.role} required onChange={e => setFormData({...formData, role: e.target.value})} style={inputStyle}>
                    <option value="admin">Admin</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="transporter">Transporter</option>
                    <option value="dealer">Dealer</option>
                    <option value="retail_shop">Retail Shop</option>
                  </select>
                  <input 
                    id="user-companyname"
                    name="companyname"
                    type="text" 
                    placeholder="Company Name *" 
                    aria-label="Company Name"
                    required 
                    value={formData.company_name} 
                    onChange={e => setFormData({...formData, company_name: e.target.value})} 
                    style={inputStyle} 
                  />
                  <input id="user-phone" name="phone" type="text" placeholder="Phone (Optional)" aria-label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
                </>
              )}

              {modalMode === 'create' && (
                <input id="user-password" name="password" type="password" placeholder="Password (min 6 chars)" aria-label="Password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
              )}
              
              {modalMode === 'reset_password' && (
                <>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Initiate a password reset for <strong>{selectedUser?.email}</strong>. An OTP will be sent to this registered email.</p>
                  {!otpSent ? (
                    <button type="button" className="primary-btn" onClick={handleSendOtp} disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send OTP'}
                    </button>
                  ) : (
                    <>
                      <input id="reset-otp" name="otp" type="text" placeholder="Enter 6-digit OTP" aria-label="6-digit OTP" required minLength={6} maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} style={inputStyle} />
                      <input id="reset-newpassword" name="new_password" type="password" placeholder="New Password (min 6 chars)" aria-label="New Password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
                    </>
                  )}
                </>
              )}


              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                {(modalMode !== 'reset_password' || otpSent) && (
                  <button type="submit" className="primary-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '0.75rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
  backgroundColor: '#ffffff',
  color: '#000000',
  width: '100%',
  boxSizing: 'border-box'
};

function UserActivityHistory({ userId }) {
  const { data, loading, error } = useApi('/admin/activity-logs');
  
  if (loading) return <p style={{ fontSize: '0.85rem', color: '#666' }}>Loading activity history...</p>;
  if (error) return <p style={{ fontSize: '0.85rem', color: '#ef4444' }}>Error loading activity history.</p>;
  
  const userLogs = (data?.logs || []).filter(log => log.user_id === userId);
  
  if (userLogs.length === 0) return <p style={{ fontSize: '0.85rem', color: '#666' }}>No activity history found for this user.</p>;
  
  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>
          <tr>
            <th style={{ padding: '0.4rem', borderBottom: '1px solid #ccc' }}>Time</th>
            <th style={{ padding: '0.4rem', borderBottom: '1px solid #ccc' }}>Action</th>
            <th style={{ padding: '0.4rem', borderBottom: '1px solid #ccc' }}>Entity</th>
          </tr>
        </thead>
        <tbody>
          {userLogs.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem', whiteSpace: 'nowrap', color: '#555' }}>{new Date(log.timestamp).toLocaleString()}</td>
              <td style={{ padding: '0.4rem', fontWeight: 'bold', color: '#333' }}>{log.action}</td>
              <td style={{ padding: '0.4rem', color: '#555' }}>{log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
