import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI, responsesAPI, paymentsAPI, reviewsAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRespondForm, setShowRespondForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [respondMessage, setRespondMessage] = useState('');
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';
  const isOwner = order?.client_id === user?.id;
  const canPay = isClient && isOwner && order?.status === 'COMPLETED';
  const canReview = order?.status === 'COMPLETED' || order?.status === 'PAID';

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await ordersAPI.getOrder(id);
        setOrder(res.data);
        if (res.data.client_id === user?.id) {
          const responsesRes = await responsesAPI.getResponses({ order_id: id, limit: 50, offset: 0 });
          setResponses(responsesRes.data.items || []);
        }
      } catch (err) {
        setError('Order not found');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, user?.id]);

  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      await responsesAPI.createResponse({ order_id: parseInt(id), message: respondMessage });
      setShowRespondForm(false);
      setRespondMessage('');
      const responsesRes = await responsesAPI.getResponses({ order_id: id, limit: 50, offset: 0 });
      setResponses(responsesRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send response');
    }
  };

  const handleAccept = async (responseId) => {
    try {
      await responsesAPI.acceptResponse(responseId);
      const res = await ordersAPI.getOrder(id);
      setOrder(res.data);
      const responsesRes = await responsesAPI.getResponses({ order_id: id, limit: 50, offset: 0 });
      setResponses(responsesRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept response');
    }
  };

  const handleReject = async (responseId) => {
    try {
      await responsesAPI.rejectResponse(responseId);
      const responsesRes = await responsesAPI.getResponses({ order_id: id, limit: 50, offset: 0 });
      setResponses(responsesRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject response');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await ordersAPI.updateStatus(id, newStatus);
      const res = await ordersAPI.getOrder(id);
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handlePay = async () => {
    try {
      await paymentsAPI.createPayment({ order_id: parseInt(id) });
      const res = await ordersAPI.getOrder(id);
      setOrder(res.data);
      await ordersAPI.updateStatus(id, 'PAID');
      const updatedOrder = await ordersAPI.getOrder(id);
      setOrder(updatedOrder.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process payment');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const reviewedUserId = order.freelancer_id || order.client_id;
      await reviewsAPI.createReview({
        reviewed_user_id: reviewedUserId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      setShowReviewForm(false);
      setReviewData({ rating: 5, comment: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await ordersAPI.deleteOrder(id);
        navigate('/orders');
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete order');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-progress';
      case 'COMPLETED': return 'status-completed';
      case 'PAID': return 'status-paid';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error && !order) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="order-details-page">
      <h1>Order Details</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="order-card">
        <div className="order-header">
          <h2>{order.title}</h2>
          <span className={`status ${getStatusColor(order.status)}`}>{order.status}</span>
        </div>
        <p className="order-description">{order.description}</p>
        <div className="order-info">
          <p><strong>Budget:</strong> ${order.budget}</p>
          <p><strong>Category:</strong> {order.category?.name || 'N/A'}</p>
          <p><strong>Created:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
        </div>

        <div className="order-actions">
          {isOwner && (
            <>
              <button onClick={() => navigate(`/orders/${id}/edit`)} className="btn btn-outline">Edit</button>
              <button onClick={handleDelete} className="btn btn-danger">Delete</button>
            </>
          )}
          {isOwner && order.status === 'IN_PROGRESS' && (
            <button onClick={() => handleStatusChange('COMPLETED')} className="btn btn-primary">Mark as Completed</button>
          )}
          {canPay && (
            <button onClick={handlePay} className="btn btn-primary">Pay</button>
          )}
          {isFreelancer && order.status === 'OPEN' && !showRespondForm && (
            <button onClick={() => setShowRespondForm(true)} className="btn btn-primary">Respond</button>
          )}
          {canReview && !showReviewForm && (
            <button onClick={() => setShowReviewForm(true)} className="btn btn-outline">Leave Review</button>
          )}
        </div>
      </div>

      {showRespondForm && (
        <div className="respond-form">
          <h3>Send Response</h3>
          <form onSubmit={handleRespond}>
            <textarea
              value={respondMessage}
              onChange={(e) => setRespondMessage(e.target.value)}
              placeholder="Your message..."
              required
              className="form-control"
              rows="4"
            />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Send</button>
              <button type="button" onClick={() => setShowRespondForm(false)} className="btn btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showReviewForm && (
        <div className="review-form">
          <h3>Leave a Review</h3>
          <form onSubmit={handleReviewSubmit}>
            <div className="form-group">
              <label>Rating</label>
              <select
                value={reviewData.rating}
                onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                className="form-control"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r} Stars</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Comment</label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                required
                className="form-control"
                rows="4"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Submit Review</button>
              <button type="button" onClick={() => setShowReviewForm(false)} className="btn btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isOwner && responses.length > 0 && (
        <div className="responses-section">
          <h3>Responses ({responses.length})</h3>
          <div className="responses-list">
            {responses.map((response) => (
              <div key={response.id} className="response-card">
                <div className="response-header">
                  <strong>{response.freelancer?.name || 'Unknown'}</strong>
                  <span className={`status ${response.status?.toLowerCase()}`}>{response.status}</span>
                </div>
                <p>{response.message}</p>
                {order.status === 'OPEN' && response.status === 'PENDING' && (
                  <div className="response-actions">
                    <button onClick={() => handleAccept(response.id)} className="btn btn-primary">Accept</button>
                    <button onClick={() => handleReject(response.id)} className="btn btn-outline">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
