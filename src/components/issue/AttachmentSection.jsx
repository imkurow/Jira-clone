import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Paperclip, Loader } from 'lucide-react';
import './AttachmentSection.css';

const AttachmentSection = ({ taskId }) => {
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchAttachments = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/tasks/${taskId}/attachments`);
                setAttachments(res.data || []);
            } catch (err) {
                console.error("Failed to load attachments", err);
            } finally {
                setLoading(false);
            }
        };

        if (taskId) fetchAttachments();
    }, [taskId]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/tasks/${taskId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAttachments([res.data, ...attachments]);
        } catch (err) {
            console.error("Failed to upload attachment", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="attachment-section">
            <div className="section-header">
                <h3 className="section-title">Attachments</h3>
                <button
                    className="add-attachment-btn btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <Paperclip size={14} /> Add Attachment
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </div>

            <div className="attachment-list">
                {loading ? <p className="loading-text">Loading attachments...</p> :
                    attachments.length === 0 && !uploading ? <p className="empty-text">No attachments yet.</p> : null}

                {uploading && <div className="attachment-item uploading"><Loader size={16} className="spin" /> Uploading...</div>}

                {attachments.map(att => (
                    <div key={att.id} className="attachment-item">
                        <Paperclip size={16} className="attachment-icon" />
                        <a href={`http://localhost:5000${att.file_path}`} target="_blank" rel="noreferrer" className="attachment-link">
                            {att.file_name}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttachmentSection;
