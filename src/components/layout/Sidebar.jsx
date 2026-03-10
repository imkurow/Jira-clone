import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Layers, Settings, Users, Box, PlusCircle, ListTodo, BarChart2 } from 'lucide-react';

const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: ListTodo, label: 'Backlog', path: '/backlog' },
    { icon: Layers, label: 'Active Sprint', path: '/board' },
    { icon: Box, label: 'Issues', path: '/issues' },
    { icon: BarChart2, label: 'Reports', path: '/reports' },
    { icon: Users, label: 'Teams', path: '/teams' },
    { icon: Settings, label: 'Project Settings', path: '/settings' },
];

// items replaced above

const Sidebar = ({ onCreateIssue }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="project-icon">
                    <span>JC</span>
                </div>
                <div className="project-info">
                    <h2>Jira Clone</h2>
                    <p>Software project</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {navItems.map((item, index) => (
                        <li key={index}>
                            <NavLink to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button className="create-issue-btn" onClick={onCreateIssue}>
                    <PlusCircle size={18} />
                    <span>Create Issue</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
