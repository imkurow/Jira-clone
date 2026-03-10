import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TopNav.css';
import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TopNav = () => {
    const { user, logout, activeTenant, setActiveTenant } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [tenants, setTenants] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'superadmin') {
            axios.get('http://localhost:5000/api/tenants')
                .then(res => setTenants(res.data))
                .catch(err => console.error("Failed to load tenants", err));
        }
    }, [user]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search?jql=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
            e.target.blur(); // Remove focus
        }
    };
    return (
        <header className="topnav">
            <div className="topnav-left">
                <div className="breadcrumb">
                    {user?.role === 'superadmin' ? (
                        <select
                            value={activeTenant?.id || user.tenantId}
                            onChange={(e) => {
                                const t = tenants.find(ten => ten.id === parseInt(e.target.value));
                                if (t) setActiveTenant(t);
                            }}
                            className="tenant-switcher"
                        >
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    ) : (
                        <span>{activeTenant?.name || user?.companyName || 'Projects'}</span>
                    )}
                    <span className="separator">/</span>
                    <span className="current">Jira Clone</span>
                </div>
            </div>

            <div className="topnav-right">
                <div className="search-bar">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search (JQL)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>

                <div className="actions">
                    <button className="icon-btn">
                        <Bell size={20} />
                    </button>
                    <button className="icon-btn">
                        <HelpCircle size={20} />
                    </button>
                    <div className="avatar" title="Logout" onClick={logout}>
                        <img src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=579dff&color=fff"} alt="User Avatar" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;
