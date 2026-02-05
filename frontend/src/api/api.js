const API_URL = 'http://localhost:8000/api';

const getToken = () => {
  const user = JSON.parse(localStorage.getItem('base44_user'));
  return user?.token;
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const language = localStorage.getItem('language') || 'en';
  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': language,
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
};

export const login = (email, password) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

export const register = (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
});

export const getMe = () => request('/auth/me');

export const updateMe = (data) => request('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const getCategories = () => request('/categories');

export const createCategory = (data) => request('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateCategory = (id, data) => request(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const deleteCategory = (id) => request(`/categories/${id}`, {
    method: 'DELETE',
});

export const getItems = (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return request(`/items?${query}`);
};

export const getServices = (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return request(`/services?${query}`);
};

export const getItem = (id) => request(`/items/${id}`);

export const getService = (id) => request(`/services/${id}`);

export const getReviews = (serviceId) => request(`/reviews/${serviceId}`);

export const addReview = (reviewData) => request('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
});

export const createItem = (itemData) => {
    const formData = new FormData();
    Object.keys(itemData).forEach(key => {
        if (key === 'images') {
            itemData.images.forEach(image => {
                formData.append('images', image);
            });
        } else {
            formData.append(key, itemData[key]);
        }
    });

    return fetch(`${API_URL}/items`, {
        method: 'POST',
        body: formData,
        headers: {
            Authorization: `Bearer ${getToken()}`,
            'Accept-Language': localStorage.getItem('language') || 'en',
        },
    }).then(res => res.json());
};

export const updateItem = (id, itemData) => request(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(itemData),
});

export const deleteItem = (id) => request(`/items/${id}`, {
    method: 'DELETE',
});

export const getMyItems = () => request('/items/my');
export const getPopularItems = (limit) => request(`/items/popular?limit=${limit}`);

export const getConversations = () => request('/conversations');

export const getMessages = (conversationId) => request(`/conversations/${conversationId}/messages`);

export const sendMessage = (conversationId, messageData) => request(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(messageData),
});

export const createConversation = (conversationData) => request('/conversations', {
    method: 'POST',
    body: JSON.stringify(conversationData),
});

export const createTrade = (tradeData) => request('/trades', {
    method: 'POST',
    body: JSON.stringify(tradeData),
});

export const getSentTrades = () => request('/trades/sent');
export const getReceivedTrades = () => request('/trades/received');
export const getTradeById = (id) => request(`/trades/${id}`);
export const updateTradeStatus = (id, status) => request(`/trades/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
});
export const addTradeMessage = (id, message) => request(`/trades/${id}/message`, {
    method: 'POST',
    body: JSON.stringify(message),
});


export const getPlatformStats = () => request('/admin/stats');
export const getAllUsers = () => request('/admin/users');
export const getAllItems = () => request('/admin/items');
export const getAllTrades = () => request('/admin/trades');
export const getOnlineUsers = () => request('/admin/online-users');
export const updateUserCoins = (userId, coins) => request(`/admin/users/${userId}/coins`, {
    method: 'PUT',
    body: JSON.stringify({ coins }),
});

export const featureItem = (itemId) => request(`/items/${itemId}/feature`, {
    method: 'POST',
});

export const uploadMessageMedia = (mediaData) => {
    return fetch(`${API_URL}/media/messages`, {
        method: 'POST',
        body: mediaData,
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).then(res => res.json());
};
