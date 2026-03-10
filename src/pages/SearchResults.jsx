import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SearchResults.css';
import { AlertCircle, Calendar, ArrowUp, ArrowDown, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

const PRIORITY_ICONS = {
    Highest: <ArrowUp color="#ff5630" size={16} />,
    High: <ArrowUp color="#ffab00" size={16} />,
    Medium: <ArrowRight color="#ffab00" size={16} />,
    Low: <ArrowDown color="#36b37e" size={16} />,
    Lowest: <ArrowDown color="#0065ff" size={16} />
};

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const jql = searchParams.get('jql') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResults = async () => {
            if (!jql) {
                setResults([]);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`/api/search?jql=${encodeURIComponent(jql)}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('jira-token')}` }
                });
                setResults(response.data);
            } catch (err) {
                console.error("Failed to fetch search results", err);
                setError(err.response?.data?.error || "Failed to execute search. Please check your JQL syntax.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [jql]);

    return (
        <div className="search-results-page">
            <div className="search-header">
                <h1>Search Results</h1>
                <div className="search-meta">
                    <span className="jql-badge">JQL</span>
                    <code className="jql-query">{jql || 'Empty Query'}</code>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Executing search...</p>
                </div>
            ) : error ? (
                <div className="error-state">
                    <AlertCircle size={24} color="#ff5630" />
                    <p>{error}</p>
                </div>
            ) : results.length === 0 ? (
                <div className="empty-state">
                    <AlertCircle size={48} color="#b3bac5" />
                    <h2>No issues found</h2>
                    <p>Try refining your JQL query.</p>
                </div>
            ) : (
                <div className="results-list">
                    <div className="results-summary">
                        1-{results.length} of {results.length} issues
                    </div>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Key</th>
                                <th>Summary</th>
                                <th>Assignee</th>
                                <th>Priority</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(task => (
                                <tr key={task.id} className="result-row" onClick={() => navigate(`/board?issue=${task.id}`)}>
                                    <td className="center-cell">
                                        <div className={`type-icon type-${task.type.toLowerCase()}`}>
                                            {task.type === 'Story' ? <CheckCircle2 size={14} color="#fff" /> :
                                                task.type === 'Bug' ? <AlertCircle size={14} color="#fff" /> :
                                                    <Clock size={14} color="#fff" />}
                                        </div>
                                    </td>
                                    <td className="task-key">JC-{task.id.split('-')[1].slice(-4)}</td>
                                    <td className="task-summary">{task.content}</td>
                                    <td>
                                        <div className="assignee-cell">
                                            {task.assignee !== 'Unassigned' && (
                                                <div className="assignee-avatar" title={task.assignee}>
                                                    {task.assignee.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span>{task.assignee}</span>
                                        </div>
                                    </td>
                                    <td className="center-cell">
                                        <span title={task.priority}>
                                            {PRIORITY_ICONS[task.priority] || PRIORITY_ICONS.Medium}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${task.column_title.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {task.column_title.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SearchResults;
