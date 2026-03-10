import React, { useState } from 'react';
import { X, Type, List } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import './CreateIssueModal.css';

const CreateIssueModal = ({ isOpen, onClose }) => {
    const { addTask, data } = useBoard();
    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [type, setType] = useState('Task');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!summary.trim()) return;

        // Add to the first column dynamically
        const firstColId = data?.columnOrder[0];
        if (!firstColId) {
            console.error("No columns available to add task");
            return;
        }

        addTask(summary, priority, type, firstColId).then(() => {
            // Note: In a real app, we'd append the task to the local state differently based on the current view (Backlog vs Board)
            // For now, if we are on the board, this task won't show up until assigned to a sprint, which is correct Jira behavior.
        });

        // Reset and close
        setSummary('');
        setDescription('');
        setPriority('Medium');
        setType('Task');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Issue</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group row">
                        <div className="form-col">
                            <label>Issue Type</label>
                            <div className="select-wrapper">
                                <List size={16} className="input-icon" />
                                <select value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="Story">Story</option>
                                    <option value="Task">Task</option>
                                    <option value="Bug">Bug</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-col">
                            <label>Priority</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="Highest">Highest</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Summary <span className="required">*</span></label>
                        <div className="input-wrapper">
                            <Type size={16} className="input-icon" />
                            <input
                                type="text"
                                required
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="What needs to be done?"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details..."
                            rows={4}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={!summary.trim()}>Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateIssueModal;
