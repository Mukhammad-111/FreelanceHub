import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categoriesAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const AdminCategories = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchCategories();
  }, [isAdmin, navigate]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoriesAPI.getCategories({ limit: 100, offset: 0 });
      setCategories(res.data.items || []);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await categoriesAPI.createCategory({ name: newCategory });
      setNewCategory('');
      setSuccess('Category created successfully');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create category');
    }
  };

  const handleUpdate = async (id) => {
    setError('');
    try {
      await categoriesAPI.updateCategory(id, { name: editName });
      setEditingId(null);
      setEditName('');
      setSuccess('Category updated successfully');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setError('');
      try {
        await categoriesAPI.deleteCategory(id);
        setSuccess('Category deleted successfully');
        fetchCategories();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete category');
      }
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-categories-page">
      <h1>Manage Categories</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <nav className="admin-nav">
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/categories" className="active">Categories</Link>
      </nav>

      <div className="create-form">
        <h2>Create New Category</h2>
        <form onSubmit={handleCreate} className="inline-form">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name"
            required
            className="form-control"
          />
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </div>

      <div className="categories-list">
        <h2>Categories</h2>
        {loading ? (
          <p>Loading...</p>
        ) : categories.length === 0 ? (
          <p>No categories found</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="form-control"
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td>{new Date(cat.created_at).toLocaleDateString()}</td>
                  <td>
                    {editingId === cat.id ? (
                      <>
                        <button onClick={() => handleUpdate(cat.id)} className="btn btn-primary btn-sm">Save</button>
                        <button onClick={() => setEditingId(null)} className="btn btn-outline btn-sm">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditName(cat.name);
                          }}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="btn btn-danger btn-sm">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
