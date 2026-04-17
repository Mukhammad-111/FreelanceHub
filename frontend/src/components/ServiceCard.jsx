import { Link } from 'react-router-dom';

const ServiceCard = ({ service }) => {
  return (
    <div className="card service-card">
      <h3>{service.title}</h3>
      <p className="card-description">{service.description}</p>
      <div className="card-footer">
        <span className="price">${service.price}</span>
        <span className="freelancer">by {service.freelancer?.name || 'Unknown'}</span>
      </div>
    </div>
  );
};

export default ServiceCard;
