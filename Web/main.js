const API_BASE = '/api/tasks';

const form = document.querySelector('#ToDo');
const taskInput = document.querySelector('#taskinput');
const tasksList = document.querySelector('#taskslist');
const searchInput = document.querySelector('#searchinput');
const filterButtons = document.querySelectorAll('.filter');
const clearCompletedButton = document.querySelector('#clearcompleted');
const statusMessage = document.querySelector('#statusmessage');
const totalCount = document.querySelector('#totalcount');
const activeCount = document.querySelector('#activecount');
const doneCount = document.querySelector('#donecount');
const progressRing = document.querySelector('#progressring');
const progressValue = document.querySelector('#progressvalue');
const focusMessage = document.querySelector('#focusmessage');
const todayLabel = document.querySelector('#todaylabel');

let tasks = [];
let currentFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  todayLabel.textContent = formatToday();
  loadTasks();
});

form.addEventListener('submit', addTask);
tasksList.addEventListener('click', handleTaskListClick);
searchInput.addEventListener('input', event => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderTasks();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle('active', item === button));
    renderTasks();
  });
});

clearCompletedButton.addEventListener('click', clearCompletedTasks);

async function loadTasks() {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('Не удалось получить задачи с сервера');
    }
    const data = await response.json();
    tasks = Array.isArray(data) ? data : [];
    setStatus('');
  } catch (error) {
    console.error(error);
    tasks = [];
    setStatus('Не удалось загрузить задачи. Проверьте сервер и обновите страницу.', true);
  }
  renderTasks();
}

function renderTasks() {
  tasksList.innerHTML = '';
  updateSummary();

  const visibleTasks = getVisibleTasks();

  if (visibleTasks.length === 0) {
    tasksList.innerHTML = getEmptyState();
    return;
  }

  visibleTasks.forEach(task => {
    const cssClass = task.completed ? 'task-text done' : 'task-text';
    const itemClass = task.completed ? 'listitem completed' : 'listitem';
    const taskHTML = `
      <li id="${task.id}" class="${itemClass}">
        <button class="done-btn" aria-label="${task.completed ? 'Вернуть в работу' : 'Отметить выполненной'}">
          ${task.completed ? '✓' : ''}
        </button>
        <span class="${cssClass}">${highlightMatch(task.text)}</span>
        <div class="task-actions">
          <button class="edit">Изменить</button>
          <button class="delete">Удалить</button>
        </div>
      </li>
    `;
    tasksList.insertAdjacentHTML('beforeend', taskHTML);
  });
}

function updateSummary() {
  const completedCount = tasks.filter(task => task.completed).length;
  const activeTasksCount = tasks.length - completedCount;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  totalCount.textContent = tasks.length;
  activeCount.textContent = activeTasksCount;
  doneCount.textContent = completedCount;
  progressValue.textContent = `${progress}%`;
  progressRing.style.setProperty('--progress', `${progress}%`);
  clearCompletedButton.disabled = completedCount === 0;

  if (tasks.length === 0) {
    focusMessage.textContent = 'Добавьте первую задачу';
  } else if (activeTasksCount === 0) {
    focusMessage.textContent = 'Все задачи закрыты';
  } else if (activeTasksCount === 1) {
    focusMessage.textContent = 'Осталась одна задача';
  } else {
    focusMessage.textContent = `В работе ${activeTasksCount} задач`;
  }
}

function getVisibleTasks() {
  return tasks.filter(task => {
    const matchesFilter =
      currentFilter === 'all' ||
      (currentFilter === 'active' && !task.completed) ||
      (currentFilter === 'done' && task.completed);
    const matchesSearch = task.text.toLowerCase().includes(searchQuery);

    return matchesFilter && matchesSearch;
  });
}

function getEmptyState() {
  if (tasks.length === 0) {
    return `
      <li class="empty-list">
        <strong>Список пуст</strong>
        <span>Запишите первую задачу, чтобы начать день с понятного шага.</span>
      </li>
    `;
  }

  if (searchQuery) {
    return `
      <li class="empty-list">
        <strong>Ничего не найдено</strong>
        <span>Попробуйте изменить поисковый запрос или фильтр.</span>
      </li>
    `;
  }

  return `
    <li class="empty-list">
      <strong>В этом фильтре пусто</strong>
      <span>Переключите фильтр или добавьте новую задачу.</span>
    </li>
  `;
}

function handleTaskListClick(event) {
  if (event.target.classList.contains('delete')) {
    deleteTask(event);
  } else if (event.target.classList.contains('done-btn')) {
    toggleTask(event);
  } else if (event.target.classList.contains('edit')) {
    startEdit(event);
  }
}

async function addTask(event) {
  event.preventDefault();
  const taskText = taskInput.value.trim();

  if (!taskText) {
    return;
  }

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: taskText, completed: false }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось добавить задачу');
    }

    if (data.task) {
      tasks.push(data.task);
      renderTasks();
      setStatus('Задача добавлена.');
    }

    form.reset();
    taskInput.focus();
  } catch (error) {
    console.error(error);
    setStatus('Не получилось добавить задачу. Попробуйте позже.', true);
  }
}

async function deleteTask(event) {
  const listItem = event.target.closest('.listitem');
  const taskId = Number(listItem.id);

  try {
    const response = await fetch(`${API_BASE}/${taskId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось удалить задачу');
    }

    tasks = tasks.filter(task => task.id !== taskId);
    renderTasks();
    setStatus('Задача удалена.');
  } catch (error) {
    console.error(error);
    setStatus('Не получилось удалить задачу. Попробуйте позже.', true);
  }
}

async function toggleTask(event) {
  const listItem = event.target.closest('.listitem');
  const taskId = Number(listItem.id);

  try {
    const response = await fetch(`${API_BASE}/${taskId}/toggle`, {
      method: 'PATCH',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось изменить статус задачи');
    }

    if (data.task) {
      tasks = tasks.map(task => (task.id === taskId ? data.task : task));
      renderTasks();
      setStatus(data.task.completed ? 'Задача отмечена выполненной.' : 'Задача снова в работе.');
    }
  } catch (error) {
    console.error(error);
    setStatus('Не получилось изменить статус. Попробуйте позже.', true);
  }
}

function startEdit(event) {
  const listItem = event.target.closest('.listitem');
  const taskId = Number(listItem.id);
  const task = tasks.find(item => item.id === taskId);

  if (!task) {
    return;
  }

  const textElement = listItem.querySelector('.task-text');
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.value = task.text;
  editInput.className = 'edit-input';
  editInput.maxLength = 500;

  textElement.replaceWith(editInput);
  editInput.focus();

  const finalizeEdit = async commit => {
    editInput.removeEventListener('blur', handleBlur);
    editInput.removeEventListener('keydown', handleKeyDown);

    if (!commit) {
      renderTasks();
      return;
    }

    const newText = editInput.value.trim();
    await finishEdit(taskId, newText, task);
  };

  const handleBlur = () => finalizeEdit(true);
  const handleKeyDown = eventKey => {
    if (eventKey.key === 'Enter') {
      eventKey.preventDefault();
      finalizeEdit(true);
    } else if (eventKey.key === 'Escape') {
      eventKey.preventDefault();
      finalizeEdit(false);
    }
  };

  editInput.addEventListener('blur', handleBlur);
  editInput.addEventListener('keydown', handleKeyDown);
}

async function finishEdit(taskId, newText, task) {
  
  if (!newText || newText === task.text) {
    renderTasks();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: newText, completed: task.completed }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось обновить задачу');
    }

    if (data.task) {
      tasks = tasks.map(item => (item.id === taskId ? data.task : item));
      renderTasks();
      setStatus('Задача обновлена.');
    }
  } catch (error) {
    console.error(error);
    setStatus('Не получилось обновить задачу. Попробуйте позже.', true);
    renderTasks();
  }
}

async function clearCompletedTasks() {
  const completedTasks = tasks.filter(task => task.completed);

  if (completedTasks.length === 0) {
    return;
  }

  clearCompletedButton.disabled = true;

  try {
    const responses = await Promise.all(
      completedTasks.map(task => fetch(`${API_BASE}/${task.id}`, { method: 'DELETE' }))
    );
    const failed = responses.some(response => !response.ok);

    if (failed) {
      throw new Error('Не удалось удалить все выполненные задачи');
    }

    const completedIds = new Set(completedTasks.map(task => task.id));
    tasks = tasks.filter(task => !completedIds.has(task.id));
    renderTasks();
    setStatus('Выполненные задачи очищены.');
  } catch (error) {
    console.error(error);
    setStatus('Не получилось очистить выполненные задачи. Попробуйте позже.', true);
    clearCompletedButton.disabled = false;
  }
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, char => map[char]);
}

function highlightMatch(text) {
  const escapedText = escapeHtml(text);

  if (!searchQuery) {
    return escapedText;
  }

  const escapedQuery = escapeHtml(searchQuery);
  const pattern = new RegExp(`(${escapeRegExp(escapedQuery)})`, 'gi');

  return escapedText.replace(pattern, '<mark>$1</mark>');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatToday() {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}
