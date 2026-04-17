import { Link } from 'react-router-dom';

const OrderCard = ({ order }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-progress';
      case 'COMPLETED': return 'status-completed';
      case 'PAID': return 'status-paid';
      default: return '';
    }
  };

  return (
    <div className="card order-card">
      <div className="card-header">
        <h3>{order.title}</h3>
        <span className={`status ${getStatusColor(order.status)}`}>{order.status}</span>
      </div>
      <p className="card-description">{order.description}</p>
      <div className="card-footer">
        <span className="budget">${order.budget}</span>
        <Link to={`/orders/${order.id}`} className="btn btn-primary">View Details</Link>
      </div>
    </div>
  );
};

export default OrderCard;
