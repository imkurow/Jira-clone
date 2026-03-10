import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CommentSection.css';
import { useAuth } from '../../context/AuthContext';

const CommentSection = ({ taskId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth(); // Just ensuring auth context is active

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await axios.get(`/api/tasks/${taskId}/comments`);
                setComments(res.data || []);
            } catch (err) {
                console.error("Failed to load comments", err);
            } finally {
                setLoading(false);
            }
        };

        if (taskId) fetchComments();
    }, [taskId]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await axios.post(`/api/tasks/${taskId}/comments`, {
                content: newComment
            });
            setComments([...comments, res.data]);
            setNewComment('');
        } catch (err) {
            console.error("Failed to add comment", err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="comment-section">
            <h3 className="section-title">Comments</h3>

            <div className="comment-list">
                {loading ? <p className="loading-text">Loading comments...</p> :
                    comments.length === 0 ? <p className="empty-text">No comments yet.</p> :
                        comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-avatar">
                                    <img src={comment.avatar || `https://ui-avatars.com/api/?name=${comment.username}&background=random&color=fff`} alt={comment.username} />
                                </div>
                                <div className="comment-body">
                                    <div className="comment-header">
                                        <span className="comment-username">{comment.username}</span>
                                        <span className="comment-date">{formatDate(comment.created_at)}</span>
                                    </div>
                                    <div className="comment-content">{comment.content}</div>
                                </div>
                            </div>
                        ))
                }
            </div>

            <form className="add-comment-form" onSubmit={handleAddComment}>
                <div className="new-comment-avatar">
                    <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random&color=fff`} alt="You" />
                </div>
                <div className="new-comment-input">
                    <textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(e);
                            }
                        }}
                    />
                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={!newComment.trim()}>Save</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CommentSection;
