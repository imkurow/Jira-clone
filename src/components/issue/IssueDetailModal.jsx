import React, { useState, useEffect } from 'react';
import { X, Check, FileText } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useBoard } from '../../context/BoardContext';
import CommentSection from './CommentSection';
import AttachmentSection from './AttachmentSection';
import SubtaskSection from './SubtaskSection';
import './IssueDetailModal.css';

const IssueDetailModal = ({ isOpen, onClose, task }) => {
    const [description, setDescription] = useState('');
    const [storyPoints, setStoryPoints] = useState('');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const { updateTask } = useBoard();

    useEffect(() => {
        if (task) {
            setDescription(task.description || '');
            setStoryPoints(task.story_points || '');
            setIsEditingDesc(false);
        }
    }, [task]);

    const handleSaveDesc = () => {
        if (task && updateTask) {
            updateTask(task.id, { description });
            setIsEditingDesc(false);
        }
    };

    const handleSaveStoryPoints = (e) => {
        const value = e.target.value;
        setStoryPoints(value);
        if (task && updateTask) {
            updateTask(task.id, { storyPoints: value ? parseInt(value, 10) : null });
        }
    };

    if (!isOpen || !task) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content issue-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="issue-type-id">
                        <span className="issue-type">{task.type}</span>
                        <span className="issue-id">{task.id}</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body-split">
                    <div className="main-content-area">
                        <h1 className="issue-title">{task.content}</h1>

                        <div className="description-section">
                            <h3 className="section-title">Description</h3>
                            {isEditingDesc ? (
                                <div className="quill-wrapper" style={{ marginBottom: '15px' }}>
                                    <ReactQuill theme="snow" value={description} onChange={setDescription} />
                                    <div className="desc-actions" style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleSaveDesc}
                                            style={{ padding: '6px 12px', background: '#0052cc', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => { setDescription(task.description || ''); setIsEditingDesc(false); }}
                                            style={{ padding: '6px 12px', background: '#f4f5f7', color: '#42526e', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="description-box html-content" onClick={() => setIsEditingDesc(true)} style={{ minHeight: '60px', padding: '10px', cursor: 'pointer', borderRadius: '3px' }}>
                                    {description && description !== '<p><br></p>' ? (
                                        <div dangerouslySetInnerHTML={{ __html: description }} />
                                    ) : (
                                        <div className="empty-description" style={{ color: '#6b778c' }}>
                                            <p>Add a description...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <AttachmentSection taskId={task.id} />
                        <SubtaskSection taskId={task.id} />
                        <CommentSection taskId={task.id} />
                    </div>

                    <div className="sidebar-area">
                        <div className="property">
                            <label>Status</label>
                            <div className="status-badge">In Progress</div>
                        </div>
                        <div className="property">
                            <label>Assignee</label>
                            <div className="assignee-val">
                                <div className="avatar micro">
                                    {task.assignee !== 'Unassigned' ? (
                                        <img src={`https://ui-avatars.com/api/?name=${task.assignee}&background=random&color=fff`} alt={task.assignee} />
                                    ) : (
                                        <div className="unassigned-avatar">?</div>
                                    )}
                                </div>
                                <span>{task.assignee}</span>
                            </div>
                        </div>
                        <div className="property">
                            <label>Priority</label>
                            <div className="priority-val">{task.priority}</div>
                        </div>
                        <div className="property">
                            <label>Story Points</label>
                            <input
                                type="number"
                                min="0"
                                value={storyPoints}
                                onChange={handleSaveStoryPoints}
                                placeholder="Estimate"
                                className="story-points-input"
                                style={{
                                    width: '100%', padding: '6px', borderRadius: '3px',
                                    border: '1px solid #dfe1e6', outline: 'none',
                                    marginTop: '4px', fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueDetailModal;
