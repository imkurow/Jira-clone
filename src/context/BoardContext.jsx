import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
    const [data, setData] = useState(null);
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, activeTenant } = useAuth();

    const fetchBoard = async (sprintId = '') => {
        if (!user || !activeTenant) return; // Ensure activeTenant is available
        setLoading(true);
        try {
            const tenantQuery = `tenantId=${activeTenant.id}`;
            const sprintQuery = sprintId ? `&sprintId=${sprintId}` : '';
            const boardUrl = `http://localhost:5000/api/boards?${tenantQuery}${sprintQuery}`;
            const sprintsUrl = `http://localhost:5000/api/sprints?${tenantQuery}`; // Add tenantId to sprints fetch

            const [boardRes, sprintsRes] = await Promise.all([
                axios.get(boardUrl),
                axios.get(sprintsUrl)
            ]);

            if (boardRes.data) {
                setData(boardRes.data);
            } else {
                setData({
                    tasks: {},
                    columns: {},
                    columnOrder: []
                });
            }

            setSprints(sprintsRes.data || []);
        } catch (err) {
            console.error("Failed to fetch board data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoard();
    }, [user, activeTenant]); // Add activeTenant to dependency array
    // Removing the duplicate fetch code

    const moveTask = async (taskId, sourceColId, destColId, sourceIndex, destIndex) => {
        const newColumns = { ...data.columns };

        // Remove from source
        const sourceTaskIds = Array.from(newColumns[sourceColId].taskIds);
        sourceTaskIds.splice(sourceIndex, 1);
        newColumns[sourceColId].taskIds = sourceTaskIds;

        // Add to destination
        const destTaskIds = sourceColId === destColId ? sourceTaskIds : Array.from(newColumns[destColId].taskIds);
        destTaskIds.splice(destIndex, 0, taskId);
        newColumns[destColId].taskIds = destTaskIds;

        const newColumnsData = {
            ...data.columns,
            ...newColumns
        };

        // Optimistic UI update
        setData({
            ...data,
            columns: newColumnsData,
        });

        // Send the updated structure to backend to persist
        try {
            await axios.put('http://localhost:5000/api/tasks/move', {
                columnsData: newColumnsData
            });
        } catch (e) {
            console.error("Failed to persist task move", e);
            // Better implementation would roll back state here on failure.
        }
    };

    const addTask = async (content, priority, type, columnId = 'col-1', parentId = null) => {
        // Note: The backend returns the new generated ID
        try {
            const res = await axios.post('http://localhost:5000/api/tasks', { columnId, content, priority, type, parentId });
            const newTaskId = res.data.id;

            const newTask = {
                id: newTaskId,
                content,
                priority,
                type,
                assignee: 'Unassigned',
                description: '',
                parentId
            };

            const newTasks = { ...data.tasks, [newTaskId]: newTask };
            const newColTaskIds = Array.from(data.columns[columnId].taskIds);
            newColTaskIds.unshift(newTaskId);

            setData({
                ...data,
                tasks: newTasks,
                columns: {
                    ...data.columns,
                    [columnId]: {
                        ...data.columns[columnId],
                        taskIds: newColTaskIds
                    }
                }
            });

        } catch (e) {
            console.error("Failed to create task", e);
        }
    };

    const updateTask = async (taskId, updates) => {
        try {
            await axios.put(`http://localhost:5000/api/tasks/${taskId}`, updates);
            setData(prev => ({
                ...prev,
                tasks: {
                    ...prev.tasks,
                    [taskId]: {
                        ...prev.tasks[taskId],
                        ...updates
                    }
                }
            }));
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    const createSprint = async (sprintData) => {
        try {
            const res = await axios.post('http://localhost:5000/api/sprints', sprintData);
            setSprints([res.data, ...sprints]);
        } catch (err) {
            console.error("Failed to create sprint", err);
        }
    };

    const updateSprint = async (sprintId, status) => {
        try {
            await axios.put(`http://localhost:5000/api/sprints/${sprintId}`, { status });
            // Refresh board data
            fetchBoard();
        } catch (err) {
            console.error("Failed to update sprint", err);
        }
    };

    return (
        <BoardContext.Provider value={{
            data, sprints, loading, fetchBoard, createSprint, updateSprint,
            moveTask, addTask, updateTask
        }}>
            {!loading && data ? children : <div style={{ padding: '40px', color: '#fff' }}>Loading Board Data...</div>}
        </BoardContext.Provider>
    );
};

export const useBoard = () => useContext(BoardContext);
