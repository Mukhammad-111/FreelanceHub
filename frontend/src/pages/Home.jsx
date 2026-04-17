import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI, servicesAPI } from '../api/api';
import OrderCard from '../components/OrderCard';
import ServiceCard from '../components/ServiceCard';

const Home = () => {
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, servicesRes] = await Promise.all([
          ordersAPI.getOrders({ page: 1, limit: 6 }),
          servicesAPI.getServices({ limit: 6, offset: 0 }),
        ]);
        setOrders(ordersRes.data.items || []);
        setServices(servicesRes.data.items || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to FreelanceHub</h1>
        <p>Connect with talented freelancers or find your next project</p>
        <div className="hero-buttons">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-outline">Register</Link>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Latest Orders</h2>
          <Link to="/orders" className="btn btn-outline">View All Orders</Link>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="cards-grid">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Featured Services</h2>
          <Link to="/services" className="btn btn-outline">View All Services</Link>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="cards-grid">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
