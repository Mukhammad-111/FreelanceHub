import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getUsers(),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data.items || []);
      } catch (err) {
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, navigate]);

  const handleBlockUser = async (userId) => {
    try {
      await adminAPI.blockUser(userId);
      const usersRes = await adminAPI.getUsers();
      setUsers(usersRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to block user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(userId);
        const usersRes = await adminAPI.getUsers();
        setUsers(usersRes.data.items || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!isAdmin) return null;

  return (
    <div className="admin-page">
      <h1>Admin Panel</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <nav className="admin-nav">
        <Link to="/admin" className="active">Dashboard</Link>
        <Link to="/admin/categories">Categories</Link>
      </nav>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats?.users_total || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-number">{stats?.orders_total || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Services</h3>
          <p className="stat-number">{stats?.services_total || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Payments</h3>
          <p className="stat-number">{stats?.payments_total || 0}</p>
        </div>
      </div>

      <div className="users-section">
        <h2>Users</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`status ${u.is_active ? 'status-open' : 'status-paid'}`}>
                      {u.is_active ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {u.id !== user?.id && (
                      <>
                        {u.is_active && (
                          <button onClick={() => handleBlockUser(u.id)} className="btn btn-outline btn-sm">
                            Block
                          </button>
                        )}
                        <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger btn-sm">
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
