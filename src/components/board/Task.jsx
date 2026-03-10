import React from 'react';
import { ArrowUp, ArrowDown, ArrowRight, CheckSquare, Bookmark, AlertCircle } from 'lucide-react';
import './Task.css';

const getPriorityIcon = (priority) => {
    switch (priority) {
        case 'Highest': return <ArrowUp size={14} color="var(--color-danger)" />;
        case 'High': return <ArrowUp size={14} color="var(--color-warning)" />;
        case 'Medium': return <ArrowRight size={14} color="var(--color-brand-primary)" />;
        case 'Low': return <ArrowDown size={14} color="var(--color-success)" />;
        default: return null;
    }
};

const getTypeIcon = (type) => {
    switch (type) {
        case 'Story': return <Bookmark size={14} color="var(--color-success)" fill="var(--color-success)" />;
        case 'Task': return <CheckSquare size={14} color="var(--color-brand-primary)" />;
        case 'Bug': return <AlertCircle size={14} color="var(--color-danger)" />;
        default: return null;
    }
};

const Task = ({ task, provided, snapshot, onClick }) => {
    return (
        <div
            className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
            onClick={onClick}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
                ...provided.draggableProps.style,
            }}
        >
            <div className="task-content">
                <p>{task.content}</p>
            </div>
            <div className="task-footer">
                <div className="task-icons">
                    {getTypeIcon(task.type)}
                    {getPriorityIcon(task.priority)}
                </div>
                <div className="task-assignee">
                    <div className="avatar micro">
                        {task.assignee !== 'Unassigned' ? (
                            <img src={`https://ui-avatars.com/api/?name=${task.assignee}&background=random&color=fff`} alt={task.assignee} />
                        ) : (
                            <div className="unassigned-avatar">?</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Task;
