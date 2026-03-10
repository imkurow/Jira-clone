import React, { useState } from 'react';
import { useBoard } from '../../context/BoardContext';
import { Plus, CheckSquare } from 'lucide-react';
import './SubtaskSection.css';

const SubtaskSection = ({ taskId }) => {
    const { data, addTask } = useBoard();
    const [adding, setAdding] = useState(false);
    const [newSubtask, setNewSubtask] = useState('');

    if (!data) return null;

    // Find subtasks
    const subtasks = Object.values(data.tasks).filter(t => t.parentId === taskId);

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if (!newSubtask.trim()) return;

        // Default to column 1 usually
        const defaultColId = data.columnOrder[0];

        await addTask(newSubtask, 'Low', 'Sub-task', defaultColId, taskId);
        setNewSubtask('');
        setAdding(false);
    };

    return (
        <div className="subtask-section">
            <h3 className="section-title">Sub-tasks</h3>

            <div className="subtask-list">
                {subtasks.length === 0 && !adding ? (
                    <p className="empty-text">No sub-tasks yet.</p>
                ) : (
                    subtasks.map(task => (
                        <div key={task.id} className="subtask-item">
                            <CheckSquare size={16} className="subtask-icon" />
                            <span className="subtask-id">{task.id}</span>
                            <span className="subtask-content">{task.content}</span>
                            <span className={`subtask-status ${data.columns[Object.keys(data.columns).find(c => data.columns[c].taskIds.includes(task.id))]?.title.toLowerCase().replace(' ', '-')}`}>
                                {data.columns[Object.keys(data.columns).find(c => data.columns[c].taskIds.includes(task.id))]?.title}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {adding ? (
                <form className="add-subtask-form" onSubmit={handleAddSubtask}>
                    <input
                        type="text"
                        placeholder="What needs to be done?"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        autoFocus
                    />
                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={!newSubtask.trim()}>Create</button>
                        <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
                    </div>
                </form>
            ) : (
                <button className="add-subtask-btn" onClick={() => setAdding(true)}>
                    <Plus size={16} /> Create sub-task
                </button>
            )}
        </div>
    );
};

export default SubtaskSection;
