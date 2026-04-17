import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { servicesAPI, categoriesAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Services = () => {
  const { isAuthenticated, isFreelancer } = useAuth();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState({ category_id: '' });

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
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params = { limit: 10, offset };
        if (filter.category_id) params.category_id = filter.category_id;
        const res = await servicesAPI.getServices(params);
        setServices(res.data.items || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [offset, filter]);

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
    setOffset(0);
  };

  return (
    <div className="services-page">
      <div className="page-header">
        <h1>Services</h1>
        {isAuthenticated && isFreelancer && (
          <Link to="/services/create" className="btn btn-primary">Create Service</Link>
        )}
      </div>

      <div className="filters">
        <select name="category_id" value={filter.category_id} onChange={handleFilterChange} className="form-control">
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : services.length === 0 ? (
        <p>No services found</p>
      ) : (
        <>
          <div className="cards-grid">
            {services.map((service) => (
              <div key={service.id} className="card service-card">
                <h3>{service.title}</h3>
                <p className="card-description">{service.description}</p>
                <div className="card-footer">
                  <span className="price">${service.price}</span>
                  <span className="freelancer">by {service.freelancer?.name || 'Unknown'}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="pagination">
            <button onClick={() => setOffset(o => Math.max(0, o - 10))} disabled={offset === 0} className="btn btn-outline">
              Previous
            </button>
            <span>Showing {offset + 1}-{offset + services.length}</span>
            <button onClick={() => setOffset(o => o + 10)} disabled={services.length < 10} className="btn btn-outline">
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Services;
