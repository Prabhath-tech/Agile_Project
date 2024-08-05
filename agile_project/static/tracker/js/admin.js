const KanbanBoard = (() => {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [
        { id: "user-1", name: "Alice" },
        { id: "user-2", name: "Bob" },
        { id: "user-3", name: "Ellie" },
        { id: "user-4", name: "George" },
        { id: "user-5", name: "Nick" },
        { id: "user-6", name: "Mike" },
        { id: "user-7", name: "Ben" },
        { id: "user-8", name: "Nimal" }
    ];
    let selectedUsers = [];

    document.addEventListener("DOMContentLoaded", () => {
        renderTasks();
        renderUsers();
        setupEventListeners();
    });

    function renderTasks() {
        const columns = ['todo', 'in-progress', 'done'];
        columns.forEach(columnId => {
            const column = document.getElementById(columnId);
            column.querySelector('.task-container').innerHTML = '';
            tasks.filter(task => task.status === columnId)
                .forEach(task => {
                    const taskElement = createTaskElement(task);
                    column.querySelector('.task-container').appendChild(taskElement);
                });
        });
    }

    function createTaskElement(task) {
        const taskDiv = document.createElement("div");
        taskDiv.id = task.id;
        taskDiv.className = "task";
        taskDiv.draggable = true;

        const userDetails = users.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
        }, {});

        const visibleUsers = task.users.slice(0, 3);
        const hiddenUsers = task.users.slice(3);

        const visibleUsersHtml = visibleUsers.map(userId => `
            <span class="user" data-id="${userId}">${userDetails[userId]}</span>
        `).join('');

        const hiddenUsersHtml = hiddenUsers.map(userId => `
            <span class="user hidden" data-id="${userId}">${userDetails[userId]}</span>
        `).join('');

        taskDiv.innerHTML = `
            <div class="task-content">${task.content}</div>
            <div class="users-container">
                ${visibleUsersHtml}
                ${hiddenUsersHtml}
                ${hiddenUsers.length > 0 ? `
                    <div class="show-more" data-task-id="${task.id}">Show more</div>
                ` : ''}
            </div>
            <span class="delete-btn" data-id="${task.id}">×</span>
        `;

        const showMoreButton = taskDiv.querySelector('.show-more');
        if (showMoreButton) {
            showMoreButton.addEventListener('click', (e) => {
                const taskId = e.target.dataset.taskId;
                const taskElement = document.getElementById(taskId);
                const hiddenUsers = taskElement.querySelectorAll('.user.hidden');
                hiddenUsers.forEach(user => {
                    user.style.display = user.style.display === 'inline' ? 'none' : 'inline';
                });
                e.target.textContent = e.target.textContent === 'Show Less' ? 'Show More' : 'Show Less';
            });
        }

        taskDiv.addEventListener("dragstart", drag);
        taskDiv.addEventListener("click", (e) => {
            highlightUsers(task.id);
            e.stopPropagation();
        });

        // Ensuring the delete button works
        taskDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
            deleteTask(task.id);
            e.stopPropagation();
        });

        return taskDiv;
    }

    function renderUsers() {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = users.map(user => `
            <div class="user" data-id="${user.id}">
                ${user.name}
            </div>
        `).join('');

        document.querySelectorAll('.users-panel .user').forEach(userDiv => {
            userDiv.addEventListener('click', (e) => {
                toggleUserSelection(userDiv.dataset.id);
                e.stopPropagation();
            });
        });
    }

    function toggleUserSelection(userId) {
        const userDiv = document.querySelector(`.users-panel .user[data-id="${userId}"]`);
        if (selectedUsers.includes(userId)) {
            selectedUsers = selectedUsers.filter(id => id !== userId);
            userDiv.classList.remove('selected');
        } else {
            selectedUsers.push(userId);
            userDiv.classList.add('selected');
        }
    }

    function addTask(columnId) {
        const taskInput = document.getElementById('taskInput');
        const taskContent = taskInput.value.trim();

        if (taskContent !== "") {
            const newTask = {
                id: "task-" + Date.now(),
                content: taskContent,
                status: columnId,
                users: [...selectedUsers]
            };

            tasks.push(newTask);
            updateLocalStorage();
            renderTasks();
            taskInput.value = "";
            selectedUsers = [];
            renderUsers();
            showConfirmation('Task added successfully');
        } else {
            showConfirmation('Task content cannot be empty');
        }
    }

    function highlightUsers(taskId) {
        document.querySelectorAll('.users-panel .user').forEach(userDiv => {
            userDiv.classList.remove('selected');
        });
        const task = tasks.find(task => task.id === taskId);
        if (task) {
            task.users.forEach(userId => {
                document.querySelector(`.users-panel .user[data-id="${userId}"]`).classList.add('selected');
            });
        }
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        updateLocalStorage();
        renderTasks();
        showConfirmation('Task deleted successfully');
    }

    function allowDrop(event) {
        event.preventDefault();
    }

    function drag(event) {
        event.dataTransfer.setData("text/plain", event.target.id);
    }

    function drop(event, columnId) {
        event.preventDefault();
        const data = event.dataTransfer.getData("text/plain");
        const draggedElement = document.getElementById(data);
        if (draggedElement) {
            updateTaskStatus(data, columnId);
            event.target.closest('.column').querySelector('.task-container').appendChild(draggedElement);
        }
    }

    function capitalizeInput(input) {
        input.value = input.value.toUpperCase();
    }

    function updateTaskStatus(taskId, newStatus) {
        tasks = tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task);
        updateLocalStorage();
    }

    function updateLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('users', JSON.stringify(users));
    }

    function showConfirmation(message) {
        const confirmation = document.createElement('div');
        confirmation.className = 'confirmation';
        confirmation.innerText = message;
        document.body.appendChild(confirmation);
        setTimeout(() => {
            confirmation.remove();
        }, 2000);
    }

    function setupEventListeners() {
        document.querySelectorAll('.add-task-btn').forEach(button => {
            button.addEventListener('click', () => {
                const columnId = button.closest('.column').id;
                addTask(columnId);
            });
        });

        ['todo', 'in-progress', 'done'].forEach(columnId => {
            const column = document.getElementById(columnId);
            column.ondrop = event => drop(event, columnId);
            column.ondragover = allowDrop;
        });

        document.getElementById('taskInput').addEventListener('input', event => capitalizeInput(event.target));

        document.addEventListener('click', (event) => {
            if (!event.target.classList.contains('user') && !event.target.classList.contains('task')) {
                clearUserSelections();
            }
        });
    }

    function clearUserSelections() {
        selectedUsers = [];
        document.querySelectorAll('.users-panel .user').forEach(userDiv => {
            userDiv.classList.remove('selected');
        });
    }

    return {
        addTask,
        renderTasks,
        deleteTask,
        updateTaskStatus
    };
})();
