import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [pendingCredential, setPendingCredential] = useState(null);
    const [error, setError] = useState('');

    const { user, login, register, loginWithGoogle } = useAuth();

    // If already logged in, redirect to the board
    if (user) {
        return <Navigate to="/" />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (pendingCredential) {
            // Completing Google Auth Registration
            if (!companyName.trim()) return setError('Company Name is required');
            const result = await loginWithGoogle(pendingCredential, companyName);
            if (!result.success) setError(result.error);
            return;
        }

        if (!username.trim() || !password.trim()) {
            return setError('Username and password are required');
        }

        if (!isLogin && !companyName.trim()) {
            return setError('Company Name is required for registration');
        }

        const action = isLogin ? login : register;
        const result = await action(username, password, companyName);

        if (!result.success) {
            setError(result.error);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        const credential = credentialResponse.credential;
        const result = await loginWithGoogle(credential, null);

        if (!result.success) {
            if (result.requireCompany) {
                setPendingCredential(credential);
                setError('Almost there! Please provide a Company Name to create your new workspace.');
            } else {
                setError(result.error);
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="project-icon large">
                        <span>JC</span>
                    </div>
                    <h2>Jira Clone</h2>
                    <p>{isLogin ? 'Log in to your account' : 'Create a new account'}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!pendingCredential && (
                        <>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                />
                            </div>
                        </>
                    )}

                    {(!isLogin || pendingCredential) && (
                        <div className="form-group">
                            <label>Company/Organization Name</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Enter your company name"
                            />
                        </div>
                    )}

                    <button type="submit" className="btn-primary auth-submit">
                        {pendingCredential ? 'Complete Profile' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                {!pendingCredential && (
                    <>
                        <div className="auth-divider">
                            <span>OR</span>
                        </div>
                        <div className="google-auth-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google Authentication Failed')}
                                useOneTap
                            />
                        </div>
                    </>
                )}

                <div className="auth-footer">
                    {isLogin ? (
                        <p>Don't have an account? <span onClick={() => setIsLogin(false)}>Sign up</span></p>
                    ) : (
                        <p>Already have an account? <span onClick={() => setIsLogin(true)}>Log in</span></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
