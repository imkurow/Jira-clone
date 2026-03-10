import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { useBoard } from '../context/BoardContext';
import './Reports.css';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('velocity');
    const [velocityData, setVelocityData] = useState([]);
    const [burndownData, setBurndownData] = useState(null);
    const [loading, setLoading] = useState(true);

    const { sprints } = useBoard();
    const completedSprints = sprints.filter(s => s.status === 'completed' || s.status === 'active');
    const [selectedSprintId, setSelectedSprintId] = useState('');

    useEffect(() => {
        if (completedSprints.length > 0 && !selectedSprintId) {
            // Default to most recently created
            const defaultSprint = [...completedSprints].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
            if (defaultSprint) setSelectedSprintId(defaultSprint.id);
        }
    }, [completedSprints, selectedSprintId]);

    useEffect(() => {
        const fetchVelocity = async () => {
            try {
                const res = await axios.get('/api/reports/velocity', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('jira-token')}` }
                });
                setVelocityData(res.data);
            } catch (e) {
                console.error(e);
            }
        };

        const fetchBurndown = async () => {
            if (!selectedSprintId) return;
            try {
                const res = await axios.get(`/api/reports/burndown/${selectedSprintId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('jira-token')}` }
                });
                setBurndownData(res.data);
            } catch (e) {
                console.error(e);
            }
        }

        setLoading(true);
        if (activeTab === 'velocity') {
            fetchVelocity().then(() => setLoading(false));
        } else {
            fetchBurndown().then(() => setLoading(false));
        }

    }, [activeTab, selectedSprintId]);


    return (
        <div className="reports-page">
            <div className="reports-header">
                <h1>Agile Reports</h1>
                <p>Analyze team performance and sprint health.</p>
            </div>

            <div className="reports-nav">
                <button
                    className={`nav-btn ${activeTab === 'velocity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('velocity')}
                >
                    <BarChart2 size={16} /> Velocity Chart
                </button>
                <button
                    className={`nav-btn ${activeTab === 'burndown' ? 'active' : ''}`}
                    onClick={() => setActiveTab('burndown')}
                >
                    <TrendingUp size={16} /> Sprint Burndown
                </button>
            </div>

            <div className="report-content">
                {loading ? (
                    <div className="loading-state"><div className="spinner"></div></div>
                ) : activeTab === 'velocity' ? (
                    <div className="chart-card">
                        <div className="card-header">
                            <h2>Velocity Chart</h2>
                            <p>Track the amount of work completed from sprint to sprint. This helps you determine your team's velocity and estimate the work your team can realistically achieve in future sprints.</p>
                        </div>
                        <div className="chart-container" style={{ height: 400, marginTop: 32 }}>
                            {velocityData.length === 0 ? (
                                <div className="empty-chart">Not enough sprint data to display velocity.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={velocityData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebecf0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#5e6c84', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5e6c84', fontSize: 12 }} />
                                        <RechartsTooltip cursor={{ fill: '#fafbfc' }} contentStyle={{ borderRadius: '3px', border: '1px solid #dfe1e6', boxShadow: '0 4px 8px -2px rgba(9, 30, 66, 0.25)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="planned" fill="#dfe1e6" name="Commitment" radius={[2, 2, 0, 0]} />
                                        <Bar dataKey="completed" fill="#36b37e" name="Completed" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="chart-card">
                        <div className="card-header burndown-header">
                            <div>
                                <h2>Sprint Burndown Chart</h2>
                                <p>Track the total work remaining and project the likelihood of achieving the sprint goal.</p>
                            </div>
                            <div className="sprint-selector">
                                <select
                                    value={selectedSprintId}
                                    onChange={e => setSelectedSprintId(e.target.value)}
                                >
                                    {completedSprints.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="chart-container" style={{ height: 400, marginTop: 32 }}>
                            {!burndownData || burndownData.data.length === 0 ? (
                                <div className="empty-chart">No data available for this sprint. Make sure tasks have estimated story points.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={burndownData.data}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebecf0" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(dateStr) => {
                                                const d = new Date(dateStr);
                                                return `${d.getMonth() + 1}/${d.getDate()}`;
                                            }}
                                            tick={{ fill: '#5e6c84', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5e6c84', fontSize: 12 }} />
                                        <RechartsTooltip
                                            cursor={{ stroke: '#b3bac5', strokeWidth: 1, strokeDasharray: '2 2' }}
                                            contentStyle={{ borderRadius: '3px', border: '1px solid #dfe1e6', boxShadow: '0 4px 8px -2px rgba(9, 30, 66, 0.25)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Area type="monotone" dataKey="ideal" stroke="#b3bac5" strokeDasharray="5 5" fill="transparent" name="Guideline" />
                                        <Area type="monotone" dataKey="remaining" stroke="#ff5630" fillOpacity={1} fill="url(#colorRemaining)" name="Remaining Values" />

                                        <defs>
                                            <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff5630" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ff5630" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>

                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
