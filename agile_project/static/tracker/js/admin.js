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

    const updateLocalStorage = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('users', JSON.stringify(users));
    };

    const calculateRemainingDays = (endDate) => {
        if (!endDate) return '';
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = Math.abs(end - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `Remaining Days: ${diffDays}`;
    };

    const showConfirmation = (message) => {
        const confirmation = document.createElement('div');
        confirmation.className = 'confirmation';
        confirmation.innerText = message;
        document.body.appendChild(confirmation);
        setTimeout(() => {
            confirmation.remove();
        }, 2000);
    };

    const allowDrop = (event) => event.preventDefault();

    const drag = (event) => event.dataTransfer.setData("text/plain", event.target.id);

    const dragUser = (event) => event.dataTransfer.setData("user-id", event.target.dataset.id);

    const drop = (event, columnId) => {
        event.preventDefault();
        const data = event.dataTransfer.getData("text/plain");
        const draggedElement = document.getElementById(data);
        if (draggedElement) {
            updateTaskStatus(data, columnId);
            event.target.closest('.column').querySelector('.task-container').appendChild(draggedElement);
        }
    };

    const dropUserOnTask = (event, taskId) => {
        event.preventDefault();
        const userId = event.dataTransfer.getData("user-id");
        const task = tasks.find(task => task.id === taskId);
        if (task && !task.users.includes(userId)) {
            task.users.push(userId);
            updateLocalStorage();
            renderTasks();
        }
    };
    function addTask(columnId) {
        const taskInput = document.getElementById('taskInput');
        const taskContent = taskInput.value.trim();

        if (taskContent !== "") {
            const newTask = {
                id: "task-" + Date.now(),
                content: taskContent,
                status: columnId,
                users: [...selectedUsers],
                description: '',
                endDate: '',
                images: []

            };

            tasks.push(newTask);
            updateLocalStorage();
            renderTasks();
            taskInput.value = "";
            selectedUsers = [];
            renderUsers();
            showConfirmation('Task added successfully');
        } else {
            alert('Task content cannot be empty. Please enter a valid task.');
        }
    }

    const deleteTask = (taskId) => {
        tasks = tasks.filter(task => task.id !== taskId);
        updateLocalStorage();
        renderTasks();
    };

    const removeUserFromTask = (taskId, userId) => {
        const task = tasks.find(task => task.id === taskId);
        if (task) {
            task.users = task.users.filter(id => id !== userId);
            updateLocalStorage();
            renderTasks();
            showConfirmation('User removed from task successfully');
        }
    };

    const deleteImage = (taskId, imageIndex) => {
        const task = tasks.find(task => task.id === taskId);
        if (task) {
            task.images.splice(imageIndex, 1);
            updateLocalStorage();
            renderTasks();
            showConfirmation('Image deleted successfully');
        }
    };

    const highlightUsers = (taskId) => {
        const task = tasks.find(task => task.id === taskId);
        document.querySelectorAll('.users-panel .user').forEach(userDiv => {
            if (task.users.includes(userDiv.dataset.id)) {
                userDiv.classList.add('highlighted');
            } else {
                userDiv.classList.remove('highlighted');
            }
        });
    };

    const toggleUserSelection = (userId) => {
        const userDiv = document.querySelector(`.users-panel .user[data-id="${userId}"]`);
        if (selectedUsers.includes(userId)) {
            selectedUsers = selectedUsers.filter(id => id !== userId);
            userDiv.classList.remove('selected');
        } else {
            selectedUsers.push(userId);
            userDiv.classList.add('selected');
        }
    };

    const updateTaskStatus = (taskId, newStatus) => {
        tasks = tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task);
        updateLocalStorage();
    };

    const capitalizeInput = (input) => input.value = input.value.toUpperCase();

    const setupUserRemoval = () => {
        document.querySelectorAll('.task .users-container .user').forEach(userDiv => {
            userDiv.addEventListener('dblclick', (e) => {
                const userId = e.target.dataset.id;
                const taskId = e.target.closest('.task').id;
                removeUserFromTask(taskId, userId);
            });
        });
    };

    const renderTasks = () => {
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
        setupUserRemoval();
    };

    const createTaskElement = (task) => {
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

        const imagesHtml = (task.images || []).map((imageSrc, index) => `
            <div class="image-wrapper">
                <img src="${imageSrc}" class="task-image" alt="Task Image">
                <span class="delete-image-btn" data-task-id="${task.id}" data-image-index="${index}">×</span>
            </div>
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
            <div class="description-container">
                <label class="description-label" data-task-id="${task.id}">${task.description ? 'View Description' : 'Add Description'}</label>
                <textarea class="description-input" data-task-id="${task.id}" style="display: none;">${task.description || ''}</textarea>
            </div>
            <div class="end-date-container">
                <label class="end-date-label" data-task-id="${task.id}">Set End Date</label>
                <input type="date" class="end-date-input" data-task-id="${task.id}" value="${task.endDate || ''}">
                <div class="remaining-days" data-task-id="${task.id}">${calculateRemainingDays(task.endDate)}</div>
            </div>
            <div class="images-container">
                ${imagesHtml}
                <input type="file" class="image-upload" data-task-id="${task.id}" accept="image/*" style="display: none;">
                <label class="image-upload-label" data-task-id="${task.id}">
                    <i class="bi bi-image"></i> Add Image
                </label>
            </div>
            <span class="delete-btn" data-id="${task.id}">×</span>
        `;

        taskDiv.querySelectorAll('.delete-image-btn').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', (e) => {
                const taskId = e.target.dataset.taskId;
                const imageIndex = e.target.dataset.imageIndex;
                if (confirm('Do you really want to delete this item?')) {
                    deleteImage(taskId, imageIndex);
                }
            });
        });

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

        taskDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
            if (confirm('Do you really want to delete this item?')) {
                deleteTask(task.id);
                e.stopPropagation();
            }
        });

        const descriptionLabel = taskDiv.querySelector('.description-label');
        const descriptionInput = taskDiv.querySelector('.description-input');

        descriptionLabel.addEventListener('click', () => {
            const isHidden = descriptionInput.style.display === 'none';
            descriptionInput.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                descriptionInput.focus();
            }
        });

        descriptionInput.addEventListener('blur', () => {
            task.description = descriptionInput.value;
            updateLocalStorage();
            descriptionLabel.innerText = descriptionInput.value ? 'View Description' : 'Add Description';
            descriptionInput.style.display = 'none';
        });

        const endDateInput = taskDiv.querySelector('.end-date-input');
        const remainingDaysDiv = taskDiv.querySelector('.remaining-days');

        endDateInput.addEventListener('change', () => {
            task.endDate = endDateInput.value;
            remainingDaysDiv.innerText = calculateRemainingDays(task.endDate);
            updateLocalStorage();
        });

        const imageUploadLabel = taskDiv.querySelector('.image-upload-label');
        const imageUploadInput = taskDiv.querySelector('.image-upload');

        imageUploadLabel.addEventListener('click', () => {
            imageUploadInput.click();
        });

        imageUploadInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    task.images = task.images || [];
                    task.images.push(e.target.result);
                    updateLocalStorage();
                    renderTasks();
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });

        taskDiv.ondrop = event => dropUserOnTask(event, task.id);
        taskDiv.ondragover = allowDrop;

        return taskDiv;
    };

    const renderUsers = () => {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = users.map(user => `
            <div class="user" data-id="${user.id}" draggable="true">
                ${user.name}
            </div>
        `).join('');

        document.querySelectorAll('.users-panel .user').forEach(userDiv => {
            userDiv.addEventListener('click', (e) => {
                toggleUserSelection(userDiv.dataset.id);
                e.stopPropagation();
            });

            userDiv.addEventListener('dragstart', dragUser);
        });
    };

    const setupEventListeners = () => {
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
            if (!event.target.closest('.task')) {
                document.querySelectorAll('.users-panel .user').forEach(userDiv => {
                    userDiv.classList.remove('selected');
                });
            }
        });
    };

    return {
        addTask,
        renderTasks,
        deleteTask,
        updateTaskStatus
    };
})();

