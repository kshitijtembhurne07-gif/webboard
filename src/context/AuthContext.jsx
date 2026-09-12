import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('noticepulse_token') || null);
  const [testAccounts, setTestAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch test accounts on mount for quick switcher
  useEffect(() => {
    fetch('/api/auth/test-accounts')
      .then(res => res.ok ? res.json() : [])
      .then(data => setTestAccounts(data))
      .catch(err => console.error('Failed to load test accounts:', err));
  }, []);

  // Validate existing token or auto-login with default member for seamless demo
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to verify token:', err);
        }
      }

      // If no token or token expired, auto-login with default test member for immediate out-of-the-box experience
      try {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'member@test.com', password: 'member123' })
        });
        if (loginRes.ok) {
          const data = await loginRes.json();
          localStorage.setItem('noticepulse_token', data.access_token);
          setToken(data.access_token);
          setUser(data.user);
        }
      } catch (err) {
        console.error('Auto-login failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('noticepulse_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const quickSwitch = async (account) => {
    const password = account.default_password || (account.role === 'admin' ? 'admin123' : 'member123');
    return await login(account.email, password);
  };

  const logout = () => {
    localStorage.removeItem('noticepulse_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        testAccounts,
        isAdmin: user?.role === 'admin',
        isAuthenticated: !!user,
        login,
        quickSwitch,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
