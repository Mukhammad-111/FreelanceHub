import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './index.css';

const API_URL = 'http://localhost:8000';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        window.location.href = '/';
      } else {
        setError(data.detail || 'Неверные данные');
      }
    } catch (err) {
      setError('Ошибка подключения');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Вход</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Введите email" />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Минимум 8 символов" />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit">Войти</button>
        </form>
        <p>Нет аккаунта? <Link to="/register">Регистрация</Link></p>
      </div>
    </div>
  );
}

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (res.ok) {
        window.location.href = '/login';
      } else {
        const data = await res.json();
        if (data.detail && data.detail.includes('already exists')) {
          setError('Пользователь с таким Email уже существует');
        } else {
          setError(data.detail || 'Ошибка регистрации');
        }
      }
    } catch (err) {
      setError('Ошибка подключения');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Регистрация</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Введите email" />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Минимум 8 символов" />
          </div>
          <div className="form-group">
            <label>Подтвердите пароль</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Повторите пароль" />
          </div>
          <div className="form-group">
            <label>Роль</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="client">Заказчик</option>
              <option value="freelancer">Исполнитель</option>
            </select>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit">Зарегистрироваться</button>
        </form>
        <p>Уже есть аккаунт? <Link to="/login">Вход</Link></p>
      </div>
    </div>
  );
}

function Navbar({ user, onLogout }) {
  const roleLabels = { client: 'ЗАКАЗЧИК', freelancer: 'ИСПОЛНИТЕЛЬ', admin: 'АДМИН' };
  return (
    <nav className="navbar">
      <Link to="/" className="logo">FreelanceHub</Link>
      <div className="nav-links">
        <Link to="/">Главная</Link>
        <Link to="/orders">Заказы</Link>
        <Link to="/services">Услуги</Link>
        {user ? (
          <>
            <Link to="/profile">Профиль</Link>
            {user.role === 'admin' && <Link to="/dashboard">Dashboard</Link>}
            {user.role === 'admin' && <Link to="/admin">Админ</Link>}
            <span className="user-badge">{roleLabels[user.role] || user.role.toUpperCase()}</span>
            <button onClick={onLogout} className="btn-outline">Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function Home() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (!data.detail) setUser(data); })
        .catch(() => {});
    }
    Promise.all([
      fetch(`${API_URL}/orders?page=1&limit=6`).then(res => res.json()),
      fetch(`${API_URL}/services?limit=6&offset=0`).then(res => res.json())
    ]).then(([ordersData, servicesData]) => {
      setOrders(ordersData.items || []);
      setServices(servicesData.items || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container">
        <div className="hero">
          <h1>Добро пожаловать в FreelanceHub</h1>
          <p>Найдите лучших фрилансеров или заказчиков для ваших проектов</p>
          {!user && <Link to="/login" className="btn-outline">Войти</Link>}
        </div>
        {loading ? <p className="loading">Загрузка...</p> : (
          <>
            <div className="section">
              <div className="section-header">
                <h2>Последние заказы</h2>
                <Link to="/orders" className="btn-outline">Все заказы</Link>
              </div>
              <div className="cards-grid">
                {orders.length === 0 ? <div className="card">Заказов пока нет</div> : orders.map(order => (
                  <Link to={`/orders/${order.id}`} key={order.id} className="card" style={{textDecoration: 'none'}}>
                    <h3>{order.title}</h3>
                    <p>{order.description}</p>
                    <div className="card-footer">
                      <span className="price">${order.budget}</span>
                      <span className={`status status-${order.status}`}>{order.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-header">
                <h2>Популярные услуги</h2>
                <Link to="/services" className="btn-outline">Все услуги</Link>
              </div>
              <div className="cards-grid">
                {services.length === 0 ? <div className="card">Услуг пока нет</div> : services.map(service => (
                  <div key={service.id} className="card">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <div className="card-footer">
                      <span className="price">${service.price}</span>
                      <span>от {service.freelancer?.name || 'Неизвестно'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Profile() {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', skills: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    Promise.all([
      fetch(`${API_URL}/profiles/me`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch(`${API_URL}/reviews/user/${localStorage.getItem('user_id') || 0}?limit=10&offset=0`).then(res => res.json()).catch(() => ({ items: [] }))
    ]).then(([profileData, reviewsData]) => {
      setProfile(profileData);
      setForm({ name: profileData.profile?.name || '', bio: profileData.profile?.bio || '', skills: profileData.profile?.skills || '' });
      setReviews(reviewsData.items || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/profiles/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setSuccess('Профиль обновлен!');
        setEditing(false);
      } else {
        const data = await res.json();
        setError(data.detail || 'Ошибка');
      }
    } catch (err) { setError('Ошибка подключения'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  if (loading) return <><Navbar /><div className="container"><p className="loading">Загрузка...</p></div></>;

  return (
    <>
      <Navbar user={profile} onLogout={handleLogout} />
      <div className="container">
        <div className="card">
          <h1>Профиль</h1>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p><strong>Роль:</strong> {profile?.role === 'client' ? 'Заказчик' : profile?.role === 'freelancer' ? 'Исполнитель' : 'Админ'}</p>
          <p><strong>Статус:</strong> {profile?.is_active ? 'Активен' : 'Заблокирован'}</p>
          <p><strong>Создан:</strong> {new Date(profile?.created_at).toLocaleDateString()}</p>
          <p><strong>Рейтинг:</strong> {profile?.profile?.rating?.toFixed(1) || 'N/A'}</p>
        </div>
        <div className="card">
          <div className="section-header">
            <h2>Данные профиля</h2>
            <button onClick={() => setEditing(!editing)} className="btn-outline">{editing ? 'Отмена' : 'Редактировать'}</button>
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div style={{color: '#22c55e', marginBottom: '15px'}}>{success}</div>}
          {editing ? (
            <>
              <div className="form-group"><label>Имя</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ваше имя" /></div>
              <div className="form-group"><label>О себе</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows="3" placeholder="Расскажите о себе" /></div>
              <div className="form-group"><label>Навыки</label><input value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="Python, JavaScript, React..." /></div>
              <button onClick={handleSave}>Сохранить</button>
            </>
          ) : (
            <>
              <p><strong>Имя:</strong> {profile?.profile?.name || 'Не указано'}</p>
              <p><strong>О себе:</strong> {profile?.profile?.bio || 'Не указано'}</p>
              <p><strong>Навыки:</strong> {profile?.profile?.skills || 'Не указаны'}</p>
            </>
          )}
        </div>
        <div className="card">
          <h2>Отзывы</h2>
          {reviews.length === 0 ? <p>Отзывов пока нет</p> : reviews.map(r => (
            <div key={r.id} style={{borderBottom: '1px solid #334155', padding: '10px 0'}}>
              <p><strong>Рейтинг:</strong> {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
              <p>{r.comment}</p>
              <small>{new Date(r.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category_id: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (!data.detail) setUser(data); });
    }
    fetch(`${API_URL}/categories?limit=50&offset=0`)
      .then(res => res.json())
      .then(data => setCategories(data.items || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let url = `${API_URL}/orders?page=1&limit=50`;
    if (filters.category_id) url += `&category_id=${filters.category_id}`;
    if (filters.status) url += `&status=${filters.status}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setOrders(data.items || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container">
        <div className="page-header">
          <h1>Все заказы</h1>
          <Link to="/orders/create" className="btn-outline">Создать заказ</Link>
        </div>
        <div className="filters">
          <select value={filters.category_id} onChange={e => setFilters({...filters, category_id: e.target.value})}>
            <option value="">Все категории</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">Все статусы</option>
            <option value="OPEN">Открыт</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="COMPLETED">Завершен</option>
            <option value="PAID">Оплачен</option>
          </select>
        </div>
        {loading ? <p className="loading">Загрузка...</p> : (
          <div className="cards-grid">
            {orders.length === 0 ? <div className="card">Заказов не найдено</div> : orders.map(order => (
              <Link to={`/orders/${order.id}`} key={order.id} className="card" style={{textDecoration: 'none'}}>
                <h3>{order.title}</h3>
                <p>{order.description}</p>
                <div className="card-footer">
                  <span className="price">${order.budget}</span>
                  <span className={`status status-${order.status}`}>{order.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function OrderDetails() {
  const id = window.location.pathname.split('/').pop();
  const [order, setOrder] = useState(null);
  const [responses, setResponses] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [respondMsg, setRespondMsg] = useState('');
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [showRespond, setShowRespond] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (!data.detail) setUser(data); localStorage.setItem('user_id', data.id); });
    }
    Promise.all([
      fetch(`${API_URL}/orders/${id}`).then(res => res.json()),
      fetch(`${API_URL}/responses?order_id=${id}&limit=50&offset=0`).then(res => res.json()).catch(() => ({ items: [] }))
    ]).then(([orderData, responsesData]) => {
      setOrder(orderData);
      setResponses(responsesData.items || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleRespond = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: parseInt(id), message: respondMsg })
      });
      if (res.ok) {
        setRespondMsg('');
        setShowRespond(false);
        fetch(`${API_URL}/responses?order_id=${id}&limit=50&offset=0`).then(res => res.json()).then(data => setResponses(data.items || []));
      }
    } catch (err) { setError('Ошибка'); }
  };

  const handleAccept = async (respId) => {
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/responses/${respId}/accept`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetch(`${API_URL}/responses?order_id=${id}&limit=50&offset=0`).then(res => res.json()).then(data => setResponses(data.items || []));
    fetch(`${API_URL}/orders/${id}`).then(res => res.json()).then(data => setOrder(data));
  };

  const handleReject = async (respId) => {
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/responses/${respId}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetch(`${API_URL}/responses?order_id=${id}&limit=50&offset=0`).then(res => res.json()).then(data => setResponses(data.items || []));
  };

  const handlePay = async () => {
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ order_id: parseInt(id) })
    });
    await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'PAID' })
    });
    fetch(`${API_URL}/orders/${id}`).then(res => res.json()).then(data => setOrder(data));
  };

  const handleReview = async () => {
    const token = localStorage.getItem('access_token');
    const reviewedId = user?.id === order?.client_id ? order?.freelancer_id : order?.client_id;
    await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reviewed_user_id: reviewedId, rating: reviewData.rating, comment: reviewData.comment })
    });
    setShowReview(false);
  };

  const handleStatusChange = async (status) => {
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    fetch(`${API_URL}/orders/${id}`).then(res => res.json()).then(data => setOrder(data));
  };

  const handleDelete = async () => {
    if (!confirm('Удалить заказ?')) return;
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    window.location.href = '/orders';
  };

  if (loading) return <><Navbar /><div className="container"><p className="loading">Загрузка...</p></div></>;

  const isOwner = user?.id === order?.client_id;
  const isFreelancer = user?.role === 'freelancer';
  const canReview = order?.status === 'COMPLETED' || order?.status === 'PAID';
  const canPay = isOwner && order?.status === 'COMPLETED';

  return (
    <>
      <Navbar user={user} onLogout={() => window.location.href = '/login'} />
      <div className="container">
        <div className="card">
          <div className="section-header">
            <h1>{order?.title}</h1>
            <span className={`status status-${order?.status}`}>{order?.status}</span>
          </div>
          <p>{order?.description}</p>
          <p><strong>Бюджет:</strong> ${order?.budget}</p>
          <p><strong>Категория:</strong> {order?.category?.name || 'N/A'}</p>
          <div className="card-footer" style={{marginTop: '15px', flexWrap: 'wrap', gap: '10px'}}>
            {isOwner && order?.status === 'OPEN' && <button onClick={() => handleStatusChange('IN_PROGRESS')}>Начать работу</button>}
            {isOwner && order?.status === 'IN_PROGRESS' && <button onClick={() => handleStatusChange('COMPLETED')}>Завершить</button>}
            {canPay && <button onClick={handlePay}>Оплатить</button>}
            {isOwner && order?.status === 'OPEN' && <button onClick={handleDelete} style={{background: '#ef4444'}}>Удалить</button>}
            {isFreelancer && order?.status === 'OPEN' && <button onClick={() => setShowRespond(true)} className="btn-outline">Откликнуться</button>}
            {canReview && <button onClick={() => setShowReview(true)} className="btn-outline">Оставить отзыв</button>}
          </div>
        </div>

        {showRespond && (
          <div className="card">
            <h3>Отклик</h3>
            <textarea value={respondMsg} onChange={e => setRespondMsg(e.target.value)} rows="4" placeholder="Ваше предложение..." />
            <button onClick={handleRespond} style={{marginTop: '10px'}}>Отправить</button>
            <button onClick={() => setShowRespond(false)} className="btn-outline" style={{marginLeft: '10px'}}>Отмена</button>
          </div>
        )}

        {showReview && (
          <div className="card">
            <h3>Отзыв</h3>
            <div className="form-group"><label>Рейтинг</label><select value={reviewData.rating} onChange={e => setReviewData({...reviewData, rating: parseInt(e.target.value)})}>
              {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ★</option>)}</select></div>
            <div className="form-group"><label>Комментарий</label><textarea value={reviewData.comment} onChange={e => setReviewData({...reviewData, comment: e.target.value})} rows="3" /></div>
            <button onClick={handleReview}>Отправить</button>
            <button onClick={() => setShowReview(false)} className="btn-outline" style={{marginLeft: '10px'}}>Отмена</button>
          </div>
        )}

        {isOwner && responses.length > 0 && (
          <div className="card">
            <h2>Отклики ({responses.length})</h2>
            {responses.map(r => (
              <div key={r.id} style={{borderBottom: '1px solid #334155', padding: '10px 0'}}>
                <p><strong>{r.freelancer?.name || 'Неизвестно'}</strong></p>
                <p>{r.message}</p>
                <p><small>Статус: {r.status}</small></p>
                {order?.status === 'OPEN' && r.status === 'PENDING' && (
                  <div style={{marginTop: '10px'}}>
                    <button onClick={() => handleAccept(r.id)}>Принять</button>
                    <button onClick={() => handleReject(r.id)} className="btn-outline" style={{marginLeft: '10px'}}>Отклонить</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </div>
    </>
  );
}

function CreateOrder() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (!data.detail) setUser(data); });
    }
    fetch(`${API_URL}/categories?limit=50&offset=0`)
      .then(res => res.json())
      .then(data => setCategories(data.items || []))
      .catch(() => setCategories([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, budget: parseFloat(budget), category_id: parseInt(categoryId) })
      });
      if (res.ok) { setSuccess(true); setTimeout(() => window.location.href = '/orders', 1500); }
      else { const data = await res.json(); setError(data.detail || 'Ошибка'); }
    } catch (err) { setError('Ошибка подключения'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container">
        <div className="auth-card" style={{maxWidth: '600px'}}>
          <h1>Создать заказ</h1>
          {error && <div className="error">{error}</div>}
          {success && <div style={{color: '#22c55e', textAlign: 'center', marginBottom: '15px'}}>Заказ создан!</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Название</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Например: Создать сайт" /></div>
            <div className="form-group"><label>Описание</label><textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Подробно опишите задачу" rows="4" style={{resize: 'vertical'}} /></div>
            <div className="form-group"><label>Бюджет ($)</label><input type="number" value={budget} onChange={e => setBudget(e.target.value)} required min="1" /></div>
            <div className="form-group"><label>Категория</label><select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              <option value="">Выберите категорию</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
            <button type="submit">Создать заказ</button>
          </form>
        </div>
      </div>
    </>
  );
}

function Services() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (!data.detail) setUser(data); });
    }
    fetch(`${API_URL}/categories?limit=50&offset=0`)
      .then(res => res.json())
      .then(data => setCategories(data.items || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let url = `${API_URL}/services?limit=10&offset=0`;
    if (filter) url += `&category_id=${filter}`;
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setServices(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setServices([]);
        setLoading(false);
      });
  }, [filter]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container">
        <div className="page-header">
          <h1>Услуги</h1>
          <Link to="/services/create" className="btn-outline">Создать услугу</Link>
        </div>
        <div className="filters">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Все категории</option>
            {categories && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {loading ? <p className="loading">Загрузка...</p> : (
          <div className="cards-grid">
            {services.length === 0 ? <div className="card">Услуг не найдено</div> : services.map(s => (
              <div key={s.id} className="card">
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <div className="card-footer">
                  <span className="price">${s.price}</span>
                  <span>от {s.freelancer?.name || 'Неизвестно'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CreateService() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (!data.detail) setUser(data); });
    }
    fetch(`${API_URL}/categories?limit=50&offset=0`)
      .then(res => res.json())
      .then(data => setCategories(data.items || []))
      .catch(() => setCategories([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, price: parseFloat(price), category_id: parseInt(categoryId) })
      });
      if (res.ok) { setSuccess(true); setTimeout(() => window.location.href = '/services', 1500); }
      else { const data = await res.json(); setError(data.detail || 'Ошибка'); }
    } catch (err) { setError('Ошибка подключения'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container">
        <div className="auth-card" style={{maxWidth: '600px'}}>
          <h1>Создать услугу</h1>
          {error && <div className="error">{error}</div>}
          {success && <div style={{color: '#22c55e', textAlign: 'center', marginBottom: '15px'}}>Услуга создана!</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Название</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Например: Разработка сайтов" /></div>
            <div className="form-group"><label>Описание</label><textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Опишите вашу услугу" rows="4" style={{resize: 'vertical'}} /></div>
            <div className="form-group"><label>Цена ($)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} required min="1" /></div>
            <div className="form-group"><label>Категория</label><select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              <option value="">Выберите категорию</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
            <button type="submit">Создать услугу</button>
          </form>
        </div>
      </div>
    </>
  );
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (!data.detail) setUser(data); });
    fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container">
        <h1>Dashboard</h1>
        <div className="cards-grid">
          <div className="card" style={{textAlign: 'center'}}>
            <h3>Пользователи</h3>
            <p className="price" style={{fontSize: '48px'}}>{stats.users_total || 0}</p>
          </div>
          <div className="card" style={{textAlign: 'center'}}>
            <h3>Заказы</h3>
            <p className="price" style={{fontSize: '48px'}}>{stats.orders_total || 0}</p>
          </div>
          <div className="card" style={{textAlign: 'center'}}>
            <h3>Услуги</h3>
            <p className="price" style={{fontSize: '48px'}}>{stats.services_total || 0}</p>
          </div>
          <div className="card" style={{textAlign: 'center'}}>
            <h3>Оплаты</h3>
            <p className="price" style={{fontSize: '48px'}}>{stats.payments_total || 0}</p>
          </div>
        </div>
        {user?.role === 'admin' && (
          <div style={{marginTop: '30px'}}>
            <Link to="/admin" className="btn-outline">Панель администратора</Link>
          </div>
        )}
      </div>
    </>
  );
}

function Admin() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    Promise.all([
      fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ]).then(([statsData, usersData]) => {
      setStats(statsData);
      setUsers(usersData.items || []);
    }).catch(err => setError('Нет доступа')).finally(() => setLoading(false));
  }, []);

  const handleBlock = async (id) => {
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/admin/users/${id}/block`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    setUsers(users.map(u => u.id === id ? {...u, is_active: false} : u));
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setUsers(users.filter(u => u.id !== id));
  };

  const handleMakeAdmin = async (id) => {
    if (!confirm('Сделать этого пользователя админом?')) return;
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/admin/users/${id}/make-admin`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    setUsers(users.map(u => u.id === id ? {...u, role: 'admin'} : u));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <div className="container">
        <h1>Админ панель</h1>
        {error && <div className="error">{error}</div>}
        <div className="nav-links" style={{marginBottom: '20px', padding: '10px', background: 'rgba(30,41,59,0.8)', borderRadius: '10px'}}>
          <Link to="/admin" style={{fontWeight: 'bold', color: '#22c55e'}}>Пользователи</Link>
          <Link to="/admin/categories">Категории</Link>
        </div>
        <div className="cards-grid" style={{marginBottom: '20px'}}>
          <div className="card" style={{textAlign: 'center'}}><h3>Пользователи</h3><p className="price" style={{fontSize: '36px'}}>{stats.users_total || 0}</p></div>
          <div className="card" style={{textAlign: 'center'}}><h3>Заказы</h3><p className="price" style={{fontSize: '36px'}}>{stats.orders_total || 0}</p></div>
          <div className="card" style={{textAlign: 'center'}}><h3>Услуги</h3><p className="price" style={{fontSize: '36px'}}>{stats.services_total || 0}</p></div>
          <div className="card" style={{textAlign: 'center'}}><h3>Оплаты</h3><p className="price" style={{fontSize: '36px'}}>{stats.payments_total || 0}</p></div>
        </div>
        {loading ? <p className="loading">Загрузка...</p> : (
          <div className="card">
            <h2>Пользователи</h2>
            <table className="table">
              <thead><tr><th>ID</th><th>Email</th><th>Роль</th><th>Статус</th><th>Действия</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td><span className={`status ${u.is_active ? 'status-OPEN' : 'status-PAID'}`}>{u.is_active ? 'Активен' : 'Заблокирован'}</span></td>
                    <td>
                      {u.role !== 'admin' && u.is_active && <button onClick={() => handleMakeAdmin(u.id)} style={{padding: '5px 10px', fontSize: '12px', background: '#22c55e', color: '#0f172a'}}>Сделать админом</button>}
                      {u.is_active && <button onClick={() => handleBlock(u.id)} className="btn-outline" style={{padding: '5px 10px', fontSize: '12px', marginLeft: '5px'}}>Заблокировать</button>}
                      <button onClick={() => handleDelete(u.id)} className="btn-outline" style={{padding: '5px 10px', fontSize: '12px', marginLeft: '5px', color: '#ef4444'}}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCats = () => fetch(`${API_URL}/categories?limit=100&offset=0`).then(res => res.json()).then(data => setCategories(data.items || []));

  useEffect(() => { fetchCats(); }, []);

  const handleCreate = async () => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newCat })
    });
    if (res.ok) { setNewCat(''); setSuccess('Создано!'); fetchCats(); }
    else { const data = await res.json(); setError(data.detail || 'Ошибка'); }
  };

  const handleUpdate = async (id) => {
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editName })
    });
    setEditId(null);
    fetchCats();
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить категорию?')) return;
    const token = localStorage.getItem('access_token');
    await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchCats();
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Управление категориями</h1>
        {error && <div className="error">{error}</div>}
        {success && <div style={{color: '#22c55e', marginBottom: '15px'}}>{success}</div>}
        <div className="nav-links" style={{marginBottom: '20px', padding: '10px', background: 'rgba(30,41,59,0.8)', borderRadius: '10px'}}>
          <Link to="/admin">Пользователи</Link>
          <Link to="/admin/categories" style={{fontWeight: 'bold', color: '#22c55e'}}>Категории</Link>
        </div>
        <div className="card">
          <h2>Создать категорию</h2>
          <div style={{display: 'flex', gap: '10px'}}>
            <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Название категории" />
            <button onClick={handleCreate}>Создать</button>
          </div>
        </div>
        <div className="card">
          <h2>Категории</h2>
          <table className="table">
            <thead><tr><th>ID</th><th>Название</th><th>Действия</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{editId === c.id ? <input value={editName} onChange={e => setEditName(e.target.value)} /> : c.name}</td>
                  <td>
                    {editId === c.id ? (
                      <><button onClick={() => handleUpdate(c.id)} style={{padding: '5px 10px', fontSize: '12px'}}>Сохранить</button>
                      <button onClick={() => setEditId(null)} className="btn-outline" style={{padding: '5px 10px', fontSize: '12px', marginLeft: '5px'}}>Отмена</button></>
                    ) : (
                      <><button onClick={() => { setEditId(c.id); setEditName(c.name); }} className="btn-outline" style={{padding: '5px 10px', fontSize: '12px'}}>Изменить</button>
                      <button onClick={() => handleDelete(c.id)} className="btn-outline" style={{padding: '5px 10px', fontSize: '12px', marginLeft: '5px', color: '#ef4444'}}>Удалить</button></>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/create" element={<CreateOrder />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/create" element={<CreateService />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
      </Routes>
    </Router>
  );
}

export default App;
