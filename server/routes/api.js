const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all tenants (Super Admin Only)
router.get('/tenants', (req, res) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const tenants = db.prepare('SELECT id, name FROM tenants ORDER BY name ASC').all();
        res.json(tenants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Get the user's primary board and its full Kanban structure (FILTERED BY TENANT)
router.get('/boards', (req, res) => {
    let tenantId = req.user.tenantId; // Default to own company

    // Super Admins can request to view a different tenant's board
    if (req.user.role === 'superadmin' && req.query.tenantId) {
        tenantId = req.query.tenantId;
    }

    try {
        const board = db.prepare('SELECT * FROM boards WHERE tenant_id = ? LIMIT 1').get(tenantId);
        if (!board) return res.json(null);

        const columns = db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC').all(board.id);
        const colIds = columns.map(c => c.id);

        // Get all tasks for these columns
        if (colIds.length > 0) {
            const placeholders = colIds.map(() => '?').join(',');
            const tasks = db.prepare(`SELECT * FROM tasks WHERE column_id IN (${placeholders}) ORDER BY position ASC`).all(...colIds);

            // Format for our frontend BoardContext structure
            const formattedData = {
                tasks: {},
                columns: {},
                columnOrder: colIds
            };

            columns.forEach(col => {
                formattedData.columns[col.id] = {
                    id: col.id,
                    title: col.title,
                    taskIds: []
                };
            });

            tasks.forEach(task => {
                formattedData.tasks[task.id] = {
                    id: task.id,
                    content: task.content,
                    priority: task.priority,
                    type: task.type,
                    assignee: task.assignee,
                    description: task.description || ''
                };

                if (formattedData.columns[task.column_id]) {
                    formattedData.columns[task.column_id].taskIds.push(task.id);
                }
            });

            res.json(formattedData);
        } else {
            res.json({ tasks: {}, columns: {}, columnOrder: [] });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Create a new task
router.post('/tasks', (req, res) => {
    const { columnId, content, priority, type } = req.body;
    // TODO: Security: Verify column belongs to tenant in a production application

    try {
        const taskId = `task-${Date.now()}`;

        // We add to top: insert at position 0, increment all other positions in column
        db.prepare('UPDATE tasks SET position = position + 1 WHERE column_id = ?').run(columnId);

        db.prepare(`
      INSERT INTO tasks (id, column_id, content, priority, type, assignee, position) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(taskId, columnId, content, priority, type, 'Unassigned', 0);

        res.json({ id: taskId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Update a task (for moving between columns or rearranging)
router.put('/tasks/move', (req, res) => {
    const { columnsData } = req.body;
    // TODO: Security: Verify all columns belong to tenant

    try {
        const updateTask = db.prepare('UPDATE tasks SET column_id = ?, position = ? WHERE id = ?');

        const transaction = db.transaction((cols) => {
            for (const [colId, col] of Object.entries(cols)) {
                col.taskIds.forEach((taskId, index) => {
                    updateTask.run(colId, index, taskId);
                });
            }
        });

        transaction(columnsData);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
