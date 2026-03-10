import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTenant, setActiveTenant] = useState(null);

    useEffect(() => {
        // Check for saved token on load
        const token = localStorage.getItem('jira-token');
        const savedUser = localStorage.getItem('jira-user');

        if (token && savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setActiveTenant({ id: parsedUser.tenantId, name: parsedUser.companyName });
            // Set default auth header for all future axios requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
            const { token, user } = res.data;

            localStorage.setItem('jira-token', token);
            localStorage.setItem('jira-user', JSON.stringify(user));

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (username, password, companyName) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', { username, password, companyName });
            const { token, user } = res.data;

            localStorage.setItem('jira-token', token);
            localStorage.setItem('jira-user', JSON.stringify(user));

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Registration failed' };
        }
    };

    const loginWithGoogle = async (credential, companyName) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/google', { credential, companyName });
            const { token, user } = res.data;

            localStorage.setItem('jira-token', token);
            localStorage.setItem('jira-user', JSON.stringify(user));

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return { success: true };
        } catch (err) {
            // Include requireCompany flag from backend if returned (HTTP 428 Precondition Required)
            return {
                success: false,
                error: err.response?.data?.error || 'Google login failed',
                requireCompany: err.response?.data?.requireCompany
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('jira-token');
        localStorage.removeItem('jira-user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setActiveTenant(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading, activeTenant, setActiveTenant }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
