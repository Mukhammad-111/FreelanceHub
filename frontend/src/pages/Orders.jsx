import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI, categoriesAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import OrderCard from '../components/OrderCard';

const Orders = () => {
  const { isAuthenticated, isClient } = useAuth();
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category_id: '',
    status: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesAPI.getCategories({ limit: 100, offset: 0 });
        setCategories(res.data.items || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (filters.category_id) params.category_id = filters.category_id;
        if (filters.status) params.status = filters.status;
        const res = await ordersAPI.getOrders(params);
        setOrders(res.data.items || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>Orders</h1>
        {isAuthenticated && isClient && (
          <Link to="/orders/create" className="btn btn-primary">Create Order</Link>
        )}
      </div>

      <div className="filters">
        <select name="category_id" value={filters.category_id} onChange={handleFilterChange} className="form-control">
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange} className="form-control">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <>
          <div className="cards-grid">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline">
              Previous
            </button>
            <span>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 10} className="btn btn-outline">
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;
