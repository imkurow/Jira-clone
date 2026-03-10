import React, { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import { useBoard } from '../../context/BoardContext';
import IssueDetailModal from '../issue/IssueDetailModal';
import './Board.css';

const Board = () => {
    const { data, sprints, moveTask, fetchBoard } = useBoard();
    const [selectedTask, setSelectedTask] = useState(null);

    React.useEffect(() => {
        // Fetch only tasks for the active sprint
        fetchBoard('active');
    }, []);

    const activeSprint = sprints.find(s => s.status === 'active');

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        moveTask(
            draggableId,
            source.droppableId,
            destination.droppableId,
            source.index,
            destination.index
        );
    };

    return (
        <div className="board-container">
            <div className="board-header">
                <h1>{activeSprint ? activeSprint.name : 'Kanban Board'}</h1>
                <div className="board-filters">
                    {!activeSprint && <span style={{ color: '#5e6c84' }}>No active sprint. Go to Backlog to start one.</span>}
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="board-columns">
                    {data.columnOrder.map((columnId) => {
                        const column = data.columns[columnId];
                        const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

                        return (
                            <Column key={column.id} column={column} tasks={tasks} onTaskClick={setSelectedTask} />
                        );
                    })}
                </div>
            </DragDropContext>

            <IssueDetailModal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                task={selectedTask}
            />
        </div>
    );
};

export default Board;
