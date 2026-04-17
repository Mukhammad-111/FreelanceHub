import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, reviewsAPI } from '../api/api';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileAPI.getProfile();
        setProfile(res.data);
        setFormData({
          name: res.data.profile?.name || '',
          bio: res.data.profile?.bio || '',
          skills: res.data.profile?.skills || '',
        });
        if (user?.id) {
          const reviewsRes = await reviewsAPI.getReviewsByUser(user.id, { limit: 10, offset: 0 });
          setReviews(reviewsRes.data.items || []);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await profileAPI.updateProfile(formData);
      setProfile(res.data);
      setEditing(false);
      setSuccess('Profile updated successfully');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      
      <div className="profile-card">
        <div className="profile-info">
          <p><strong>Email:</strong> {profile?.email}</p>
          <p><strong>Role:</strong> {profile?.role}</p>
          <p><strong>Status:</strong> {profile?.is_active ? 'Active' : 'Inactive'}</p>
          <p><strong>Created:</strong> {new Date(profile?.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {editing ? (
        <div className="edit-form">
          <h2>Edit Profile</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="form-control"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Skills</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="form-control"
                placeholder="Comma separated skills"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="btn btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="profile-details">
          <div className="profile-section">
            <h2>Profile Details</h2>
            <button onClick={() => setEditing(true)} className="btn btn-primary">Edit Profile</button>
          </div>
          <p><strong>Name:</strong> {profile?.profile?.name || 'Not set'}</p>
          <p><strong>Bio:</strong> {profile?.profile?.bio || 'Not set'}</p>
          <p><strong>Skills:</strong> {profile?.profile?.skills || 'Not set'}</p>
          <p><strong>Rating:</strong> {profile?.profile?.rating?.toFixed(1) || 'N/A'}</p>
        </div>
      )}

      <div className="reviews-section">
        <h2>Reviews</h2>
        {reviews.length === 0 ? (
          <p>No reviews yet</p>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <span className="rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span className="date">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <p>{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
