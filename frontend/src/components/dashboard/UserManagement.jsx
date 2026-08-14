import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/services/adminApi';
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
      setUsers(response.data || []);
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
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    if (window.confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this account?`)) {
      try {
        await adminApi.updateUserStatus(user.id, user.is_active ? 0 : 1);
        fetchUsers();
      } catch (err) {
        alert('Failed to update status: ' + err.message);
      }
    }
  };

  const isCompanyRequired = (role) => {
    return ['manufacturer', 'dealer', 'retail_shop'].includes(role);
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
      } else if (modalMode === 'edit') {
        await adminApi.updateUser(selectedUser.id, formData);
        setSuccessMessage('User updated successfully.');
      } else if (modalMode === 'reset_password') {
        await adminApi.resetUserPassword(selectedUser.id, formData.password);
        setSuccessMessage('Password reset successfully.');
      }
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
        <button className="primary-btn" onClick={openCreateModal}>+ Create User</button>
      </div>

      {successMessage && <div style={{ padding: '1rem', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '1rem' }}>{successMessage}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search username, name, company..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'var(--card-bg)', color: '#fff' }}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--card-bg)', color: '#fff' }}>
          <option value="All">All Roles</option>
          <option value="manufacturer">Manufacturer</option>
          <option value="transporter">Transporter</option>
          <option value="dealer">Dealer</option>
          <option value="retail_shop">Retail</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--card-bg)', color: '#fff' }}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <StateBoundary loading={loading} error={error} empty={filteredUsers.length === 0} onRetry={fetchUsers} emptyMessage="No users found.">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '0.75rem' }}>{user.name}</td>
                <td>{user.username}</td>
                <td>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#333' }}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td>{user.company_name || '-'}</td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    backgroundColor: user.is_active ? '#2e7d32' : '#c62828' 
                  }}>
                    {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="muted" style={{ fontSize: '0.8rem' }}>{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}</td>
                <td>
                  <button className="secondary-btn" style={{ fontSize: '0.8rem', marginRight: '0.5rem' }} onClick={() => openEditModal(user)}>Edit</button>
                  <button className="secondary-btn" style={{ fontSize: '0.8rem', marginRight: '0.5rem' }} onClick={() => handleToggleStatus(user)}>
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="secondary-btn" style={{ fontSize: '0.8rem' }} onClick={() => openResetPasswordModal(user)}>Reset Pwd</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </StateBoundary>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'var(--card-bg)' }}>
            <h3 style={{ marginTop: 0 }}>
              {modalMode === 'create' && 'Create User'}
              {modalMode === 'edit' && 'Edit User'}
              {modalMode === 'reset_password' && 'Reset Password'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {modalMode !== 'reset_password' && (
                <>
                  <input type="text" placeholder="Full Name" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={inputStyle} />
                  <input type="text" placeholder="Username" required disabled={modalMode === 'edit'} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={inputStyle} />
                  {modalMode === 'create' && (
                    <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
                  )}
                  <select value={formData.role} required onChange={e => setFormData({...formData, role: e.target.value})} style={inputStyle}>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="transporter">Transporter</option>
                    <option value="dealer">Dealer</option>
                    <option value="retail_shop">Retail Shop</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder={`Company Name ${isCompanyRequired(formData.role) ? '*' : '(Optional)'}`} 
                    required={isCompanyRequired(formData.role)} 
                    value={formData.company_name} 
                    onChange={e => setFormData({...formData, company_name: e.target.value})} 
                    style={inputStyle} 
                  />
                  {isCompanyRequired(formData.role) && <span style={{ fontSize: '0.75rem', color: '#ffb74d' }}>Company name is required for {formData.role} accounts.</span>}
                  <input type="text" placeholder="Phone (Optional)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
                </>
              )}

              {(modalMode === 'create' || modalMode === 'reset_password') && (
                <input type="password" placeholder="Password (min 6 chars)" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '0.75rem',
  borderRadius: '4px',
  border: '1px solid #444',
  backgroundColor: '#222',
  color: '#fff',
  width: '100%',
  boxSizing: 'border-box'
};
