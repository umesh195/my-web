// Task Management Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.editingTaskId = null;
        
        this.init();
    }

    init() {
        this.loadTasks();
        this.bindEvents();
        this.render();
    }

    // Load tasks from localStorage
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            try {
                this.tasks = JSON.parse(savedTasks);
            } catch (error) {
                console.error('Error loading tasks:', error);
                this.tasks = [];
            }
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showError('Failed to save tasks. Storage may be full.');
        }
    }

    // Generate unique ID for tasks
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Bind all event listeners
    bindEvents() {
        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim().toLowerCase();
            this.render();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Clear completed tasks
        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.clearCompletedTasks();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        // Close modal when clicking outside
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Add new task
    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();

        if (!text) {
            this.showError('Please enter a task description.');
            return;
        }

        if (text.length > 500) {
            this.showError('Task description is too long (max 500 characters).');
            return;
        }

        const task = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        
        input.value = '';
        this.hideError();
        
        // Add success animation
        this.animateSuccess();
    }

    // Toggle task completion
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.render();
        }
    }

    // Delete task
    deleteTask(id) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.add('fade-out');
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.saveTasks();
                this.render();
            }, 300);
        }
    }

    // Edit task
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            document.getElementById('editTaskInput').value = task.text;
            this.showModal();
        }
    }

    // Save edited task
    saveEdit() {
        const newText = document.getElementById('editTaskInput').value.trim();
        
        if (!newText) {
            this.showError('Please enter a task description.');
            return;
        }

        if (newText.length > 500) {
            this.showError('Task description is too long (max 500 characters).');
            return;
        }

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = newText;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.render();
            this.closeModal();
        }
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    // Clear completed tasks
    clearCompletedTasks() {
        const completedTasks = this.tasks.filter(t => t.completed);
        if (completedTasks.length === 0) {
            return;
        }

        if (confirm(`Are you sure you want to delete ${completedTasks.length} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
        }
    }

    // Filter tasks based on current filter and search
    getFilteredTasks() {
        let filteredTasks = this.tasks;

        // Apply status filter
        switch (this.currentFilter) {
            case 'active':
                filteredTasks = filteredTasks.filter(t => !t.completed);
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(t => t.completed);
                break;
            default:
                // 'all' - no filtering needed
                break;
        }

        // Apply search filter
        if (this.searchQuery) {
            filteredTasks = filteredTasks.filter(t => 
                t.text.toLowerCase().includes(this.searchQuery)
            );
        }

        return filteredTasks;
    }

    // Render tasks
    render() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();
        
        // Update task counter
        this.updateTaskCounter();
        
        // Update clear completed button
        this.updateClearButton();
        
        // Handle empty states
        this.handleEmptyStates(filteredTasks);
        
        // Render tasks
        taskList.innerHTML = '';
        
        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    // Create task element
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 onclick="taskManager.toggleTask('${task.id}')">
            </div>
            <div class="task-text">${this.escapeHtml(task.text)}</div>
            <div class="task-actions">
                <button class="task-btn edit-btn" onclick="taskManager.editTask('${task.id}')" 
                        title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete-btn" onclick="taskManager.deleteTask('${task.id}')" 
                        title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return li;
    }

    // Update task counter
    updateTaskCounter() {
        const totalTasks = this.tasks.length;
        const activeTasks = this.tasks.filter(t => !t.completed).length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        
        const counter = document.getElementById('taskCount');
        
        switch (this.currentFilter) {
            case 'active':
                counter.textContent = activeTasks;
                break;
            case 'completed':
                counter.textContent = completedTasks;
                break;
            default:
                counter.textContent = totalTasks;
                break;
        }
    }

    // Update clear completed button
    updateClearButton() {
        const clearBtn = document.getElementById('clearCompleted');
        const completedTasks = this.tasks.filter(t => t.completed).length;
        
        clearBtn.disabled = completedTasks === 0;
        clearBtn.textContent = completedTasks > 0 ? 
            `Clear Completed (${completedTasks})` : 
            'Clear Completed';
    }

    // Handle empty states
    handleEmptyStates(filteredTasks) {
        const emptyState = document.getElementById('emptyState');
        const noResults = document.getElementById('noResults');
        
        if (this.tasks.length === 0) {
            emptyState.classList.remove('hidden');
            noResults.classList.add('hidden');
        } else if (filteredTasks.length === 0) {
            emptyState.classList.add('hidden');
            noResults.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            noResults.classList.add('hidden');
        }
    }

    // Show modal
    showModal() {
        const modal = document.getElementById('editModal');
        modal.classList.add('show');
        document.getElementById('editTaskInput').focus();
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('show');
        this.editingTaskId = null;
        this.hideError();
    }

    // Show error message
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    // Hide error message
    hideError() {
        const errorElement = document.getElementById('errorMessage');
        errorElement.classList.remove('show');
    }

    // Animate success
    animateSuccess() {
        const addBtn = document.querySelector('.add-btn');
        addBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            addBtn.style.transform = '';
        }, 150);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export tasks (bonus feature)
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tasks_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Import tasks (bonus feature)
    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.saveTasks();
                    this.render();
                    alert('Tasks imported successfully!');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                alert('Error importing tasks. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the application
let taskManager;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to add task
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const taskInput = document.getElementById('taskInput');
            if (document.activeElement === taskInput) {
                document.getElementById('taskForm').dispatchEvent(new Event('submit'));
            }
        }
        
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });
    
    // Add service worker for offline support (optional)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Service worker registration would go here
            // For now, we'll just log that we could add offline support
            console.log('App is ready for offline support via service worker');
        });
    }
});

// Handle page visibility changes (pause/resume functionality)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Refresh data when user returns to tab
        if (taskManager) {
            taskManager.loadTasks();
            taskManager.render();
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('App is online');
});

window.addEventListener('offline', () => {
    console.log('App is offline - using local storage');
});
