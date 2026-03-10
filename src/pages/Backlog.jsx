import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useBoard } from '../context/BoardContext';
import IssueDetailModal from '../components/issue/IssueDetailModal';
import { Plus } from 'lucide-react';
import './Backlog.css';

const Backlog = () => {
    const { data, sprints, updateTask, updateSprint, createSprint } = useBoard();
    const [selectedTask, setSelectedTask] = useState(null);

    if (!data) return <div>Loading Backlog...</div>;

    // Separate tasks by sprint
    const activeSprint = sprints.find(s => s.status === 'active');
    const plannedSprints = sprints.filter(s => s.status === 'planned');

    // Convert object of tasks into array
    const allTasksArray = Object.values(data.tasks);

    // Backlog tasks have sprintId == null
    const backlogTasks = allTasksArray.filter(t => !t.sprintId);

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Determine new sprint ID
        const newSprintId = destination.droppableId === 'backlog-droppable' ? null : destination.droppableId;

        // Optimistic UI update could be complex here since we rely on `data.tasks` which is flat.
        // We will just call the update function directly.
        updateTask(draggableId, { sprintId: newSprintId });
    };

    const handleStartSprint = (sprintId) => {
        if (activeSprint) {
            alert('There is already an active sprint. You must complete it first.');
            return;
        }
        updateSprint(sprintId, 'active');
    };

    const handleCreateSprint = () => {
        createSprint({
            name: `Sprint ${sprints.length + 1}`,
            goal: 'Deliver scheduled backlog items',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks
        });
    };

    const renderTaskList = (tasksList, droppableId) => (
        <Droppable droppableId={droppableId}>
            {(provided) => (
                <div
                    className="task-list"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                    {tasksList.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                                <div
                                    className="backlog-task"
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <div className="task-left">
                                        <span className="task-type">{task.type.charAt(0).toUpperCase()}</span>
                                        <span className="task-id">{task.id.split('-')[1].substring(0, 4)}</span>
                                        <span className="task-content">{task.content}</span>
                                    </div>
                                    <div className="task-right">
                                        <span className="task-priority">{task.priority}</span>
                                        <div className="task-assignee" title={task.assignee}>
                                            {task.assignee.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );

    return (
        <div className="backlog-page">
            <div className="backlog-header">
                <h1>Backlog</h1>
                <button className="create-sprint-btn" onClick={handleCreateSprint}>
                    Create Sprint
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="sprints-container">

                    {/* Active Sprint Section (if any) */}
                    {activeSprint && (
                        <div className="sprint-block active-sprint">
                            <div className="sprint-header">
                                <h3>{activeSprint.name} <span className="sprint-dates">(ACTIVE)</span></h3>
                                <button className="btn-start-sprint" onClick={() => updateSprint(activeSprint.id, 'completed')}>
                                    Complete Sprint
                                </button>
                            </div>
                            {activeSprint.goal && <div className="sprint-goal">{activeSprint.goal}</div>}
                            {renderTaskList(allTasksArray.filter(t => t.sprintId === activeSprint.id), activeSprint.id)}
                        </div>
                    )}

                    {/* Planned Sprints */}
                    {plannedSprints.map(sprint => {
                        const sprintTasks = allTasksArray.filter(t => t.sprintId === sprint.id);
                        return (
                            <div key={sprint.id} className="sprint-block">
                                <div className="sprint-header">
                                    <h3>{sprint.name} <span className="sprint-dates">({sprintTasks.length} issues)</span></h3>
                                    <button
                                        className={`btn-start-sprint ${sprintTasks.length > 0 ? 'primary' : ''}`}
                                        disabled={sprintTasks.length === 0}
                                        onClick={() => handleStartSprint(sprint.id)}
                                    >
                                        Start Sprint
                                    </button>
                                </div>
                                {renderTaskList(sprintTasks, sprint.id)}
                            </div>
                        );
                    })}

                    {/* Backlog itself */}
                    <div className="backlog-block">
                        <div className="sprint-header">
                            <h3>Backlog <span className="sprint-dates">({backlogTasks.length} issues)</span></h3>
                        </div>
                        {renderTaskList(backlogTasks, 'backlog-droppable')}
                    </div>

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

export default Backlog;
