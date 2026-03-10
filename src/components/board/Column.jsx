import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import Task from './Task';
import './Column.css';

const Column = ({ column, tasks, onTaskClick }) => {
    return (
        <div className="column-container">
            <div className="column-header">
                <h3 className="column-title">{column.title}</h3>
                <span className="task-count">{tasks.length}</span>
            </div>

            <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                    <div
                        className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                    <Task
                                        task={task}
                                        provided={provided}
                                        snapshot={snapshot}
                                        onClick={() => onTaskClick(task)}
                                    />
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default Column;
