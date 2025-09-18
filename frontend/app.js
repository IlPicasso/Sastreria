const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000';

const state = {
  statuses: [],
  token: null,
  user: null,
  tailors: [],
  orders: [],
};

const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('.nav-button');
const orderLookupForm = document.getElementById('orderLookupForm');
const orderResultContainer = document.getElementById('orderStatusResult');
const staffLoginForm = document.getElementById('staffLoginForm');
const staffDashboard = document.getElementById('staffDashboard');
const staffLoginCard = document.getElementById('staffLogin');
const logoutButton = document.getElementById('logoutButton');
const createOrderForm = document.getElementById('createOrderForm');
const ordersTableBody = document.getElementById('ordersTableBody');
const measurementsList = document.getElementById('measurementsList');
const addMeasurementButton = document.getElementById('addMeasurementButton');
const statusSelect = document.getElementById('newOrderStatus');
const assignTailorSelect = document.getElementById('assignTailor');
const toastElement = document.getElementById('toast');
const currentYearElement = document.getElementById('currentYear');
const currentUserNameElement = document.getElementById('currentUserName');
const currentUserRoleElement = document.getElementById('currentUserRole');

const ROLE_LABELS = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  sastre: 'Sastre',
};

function setActiveView(viewId) {
  views.forEach((view) => {
    if (view.id === viewId) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });
  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => setActiveView(btn.dataset.view));
});

if (currentYearElement) {
  currentYearElement.textContent = new Date().getFullYear();
}

function showToast(message, type = 'info') {
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.className = `toast show ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
  setTimeout(() => {
    toastElement.classList.remove('show', 'success', 'error');
  }, 3500);
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleString('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    return dateString;
  }
}

async function apiFetch(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const options = { method, headers: { ...headers } };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
  }
  if (auth && state.token) {
    options.headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401 && state.token) {
      handleLogout(true);
    }
    const message = data?.detail || data?.message || (typeof data === 'string' ? data : 'Error en la solicitud');
    throw new Error(message || 'Error en la solicitud');
  }

  return data;
}

function displayOrderResult(order) {
  if (!orderResultContainer) return;
  orderResultContainer.classList.remove('hidden');
  const measurements = order.measurements?.length
    ? `<div class="measurement-tags">${order.measurements
        .map((item) => `<span class="tag">${item.nombre}: ${item.valor}</span>`)
        .join('')}</div>`
    : '<p class="muted">No hay medidas registradas.</p>';

  orderResultContainer.innerHTML = `
    <h3>Orden ${order.order_number}</h3>
    <p><strong>Cliente:</strong> ${order.customer_name}</p>
    <p><strong>Estado:</strong> ${order.status}</p>
    ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
    <p><strong>Última actualización:</strong> ${formatDate(order.updated_at)}</p>
    ${measurements}
  `;
}

function displayOrderNotFound(orderNumber) {
  if (!orderResultContainer) return;
  orderResultContainer.classList.remove('hidden');
  orderResultContainer.innerHTML = `<p>No se encontró información para la orden <strong>${orderNumber}</strong>. Verifica el número ingresado.</p>`;
}

function clearOrderResult() {
  if (!orderResultContainer) return;
  orderResultContainer.classList.add('hidden');
  orderResultContainer.innerHTML = '';
}

if (orderLookupForm) {
  orderLookupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.getElementById('orderNumber');
    if (!input) return;
    const orderNumber = input.value.trim();
    if (!orderNumber) return;
    try {
      const order = await apiFetch(`/public/orders/${encodeURIComponent(orderNumber)}`, { auth: false });
      displayOrderResult(order);
    } catch (error) {
      displayOrderNotFound(orderNumber);
      showToast(error.message, 'error');
    }
  });
}

function populateStatusSelect(selectElement, selectedValue = '') {
  if (!selectElement) return;
  selectElement.innerHTML = '';
  state.statuses.forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    if (selectedValue && selectedValue === status) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

function populateTailorSelect(selectElement, selectedId = '') {
  if (!selectElement) return;
  selectElement.innerHTML = '';
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Sin asignar';
  selectElement.appendChild(emptyOption);
  state.tailors.forEach((tailor) => {
    const option = document.createElement('option');
    option.value = String(tailor.id);
    option.textContent = tailor.full_name;
    if (selectedId && String(selectedId) === String(tailor.id)) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

function addMeasurementRow(data = { nombre: '', valor: '' }) {
  const row = document.createElement('div');
  row.className = 'measurement-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Ej. Pecho';
  nameInput.value = data.nombre || '';
  nameInput.dataset.field = 'nombre';

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.placeholder = 'Ej. 98 cm';
  valueInput.value = data.valor || '';
  valueInput.dataset.field = 'valor';

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.textContent = 'Eliminar';
  removeButton.addEventListener('click', () => {
    row.remove();
    ensureMeasurementRow();
  });

  row.appendChild(nameInput);
  row.appendChild(valueInput);
  row.appendChild(removeButton);
  measurementsList.appendChild(row);
}

function ensureMeasurementRow() {
  if (measurementsList && measurementsList.children.length === 0) {
    addMeasurementRow();
  }
}

if (addMeasurementButton) {
  addMeasurementButton.addEventListener('click', () => addMeasurementRow());
}

function collectMeasurements() {
  if (!measurementsList) return [];
  return Array.from(measurementsList.querySelectorAll('.measurement-row'))
    .map((row) => {
      const nombre = row.querySelector('input[data-field="nombre"]').value.trim();
      const valor = row.querySelector('input[data-field="valor"]').value.trim();
      return nombre && valor ? { nombre, valor } : null;
    })
    .filter(Boolean);
}

function resetCreateOrderForm() {
  if (!createOrderForm) return;
  createOrderForm.reset();
  populateStatusSelect(statusSelect);
  populateTailorSelect(assignTailorSelect);
  measurementsList.innerHTML = '';
  addMeasurementRow();
}

function updateUserInfo() {
  if (!state.user) return;
  if (currentUserNameElement) {
    currentUserNameElement.textContent = state.user.full_name;
  }
  if (currentUserRoleElement) {
    currentUserRoleElement.textContent = ROLE_LABELS[state.user.role] || state.user.role;
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const submitButton = staffLoginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const token = await apiFetch('/auth/login', {
      method: 'POST',
      body: { username, password },
      auth: false,
    });
    state.token = token.access_token;
    await loadCurrentUser();
    await loadStatuses();
    await Promise.all([loadTailors(), loadOrders()]);
    showDashboard();
    resetCreateOrderForm();
    showToast('Bienvenido, sesión iniciada.', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
}

async function loadStatuses() {
  const statuses = await apiFetch('/statuses', { auth: false });
  state.statuses = statuses;
  populateStatusSelect(statusSelect);
}

async function loadTailors() {
  if (!state.token) return;
  try {
    state.tailors = await apiFetch('/users/tailors');
  } catch (error) {
    showToast(error.message, 'error');
  }
  populateTailorSelect(assignTailorSelect);
}

async function loadOrders() {
  if (!state.token) return;
  try {
    state.orders = await apiFetch('/orders');
    renderOrders();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadCurrentUser() {
  state.user = await apiFetch('/users/me');
  updateUserInfo();
}

function showDashboard() {
  if (staffDashboard) {
    staffDashboard.classList.remove('hidden');
  }
  if (staffLoginCard) {
    staffLoginCard.classList.add('hidden');
  }
}

function hideDashboard() {
  if (staffDashboard) {
    staffDashboard.classList.add('hidden');
  }
  if (staffLoginCard) {
    staffLoginCard.classList.remove('hidden');
  }
}

function handleLogout(auto = false) {
  state.token = null;
  state.user = null;
  state.orders = [];
  state.tailors = [];
  if (assignTailorSelect) {
    populateTailorSelect(assignTailorSelect);
  }
  hideDashboard();
  ordersTableBody.innerHTML = '';
  if (auto) {
    showToast('La sesión ha expirado, vuelve a iniciar sesión.', 'error');
  }
}

if (staffLoginForm) {
  staffLoginForm.addEventListener('submit', handleLogin);
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    handleLogout(false);
    showToast('Sesión cerrada correctamente.', 'success');
  });
}

async function createOrder(event) {
  event.preventDefault();
  const newOrderNumber = document.getElementById('newOrderNumber').value.trim();
  const newCustomerName = document.getElementById('newCustomerName').value.trim();
  const newCustomerContact = document.getElementById('newCustomerContact').value.trim();
  const newOrderStatus = document.getElementById('newOrderStatus').value;
  const newOrderNotes = document.getElementById('newOrderNotes').value.trim();
  const assignedTailorId = assignTailorSelect.value ? Number(assignTailorSelect.value) : null;
  const measurements = collectMeasurements();

  const submitButton = createOrderForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    await apiFetch('/orders', {
      method: 'POST',
      body: {
        order_number: newOrderNumber,
        customer_name: newCustomerName,
        customer_contact: newCustomerContact || null,
        status: newOrderStatus,
        notes: newOrderNotes || null,
        measurements,
        assigned_tailor_id: assignedTailorId,
      },
    });
    await loadOrders();
    resetCreateOrderForm();
    showToast('Orden creada correctamente.', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
}

if (createOrderForm) {
  createOrderForm.addEventListener('submit', createOrder);
}

function createStatusSelect(currentStatus) {
  const select = document.createElement('select');
  populateStatusSelect(select, currentStatus);
  return select;
}

function createTailorSelector(selectedId) {
  const select = document.createElement('select');
  populateTailorSelect(select, selectedId ?? '');
  return select;
}

function renderOrders() {
  if (!ordersTableBody) return;
  ordersTableBody.innerHTML = '';
  if (!state.orders.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.textContent = 'No hay órdenes registradas todavía.';
    cell.className = 'muted';
    row.appendChild(cell);
    ordersTableBody.appendChild(row);
    return;
  }

  state.orders.forEach((order) => {
    const row = document.createElement('tr');

    const orderCell = document.createElement('td');
    orderCell.innerHTML = `<strong>${order.order_number}</strong><br /><small>${formatDate(order.created_at)}</small>`;

    const customerCell = document.createElement('td');
    customerCell.textContent = order.customer_name;

    const contactCell = document.createElement('td');
    const contactInput = document.createElement('input');
    contactInput.type = 'text';
    contactInput.value = order.customer_contact || '';
    contactCell.appendChild(contactInput);

    const statusCell = document.createElement('td');
    const statusSelector = createStatusSelect(order.status);
    statusCell.appendChild(statusSelector);

    const tailorCell = document.createElement('td');
    const tailorSelector = createTailorSelector(order.assigned_tailor?.id);
    tailorCell.appendChild(tailorSelector);

    const measurementsCell = document.createElement('td');
    if (order.measurements?.length) {
      order.measurements.forEach((item) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = `${item.nombre}: ${item.valor}`;
        measurementsCell.appendChild(tag);
      });
    } else {
      measurementsCell.innerHTML = '<span class="muted">Sin medidas</span>';
    }

    const notesCell = document.createElement('td');
    const notesTextarea = document.createElement('textarea');
    notesTextarea.rows = 2;
    notesTextarea.value = order.notes || '';
    notesCell.appendChild(notesTextarea);

    const actionsCell = document.createElement('td');
    const saveButton = document.createElement('button');
    saveButton.className = 'primary';
    saveButton.textContent = 'Guardar';
    saveButton.addEventListener('click', async () => {
      saveButton.disabled = true;
      try {
        await apiFetch(`/orders/${order.id}`, {
          method: 'PATCH',
          body: {
            status: statusSelector.value,
            assigned_tailor_id: tailorSelector.value ? Number(tailorSelector.value) : null,
            customer_contact: contactInput.value.trim() || null,
            notes: notesTextarea.value.trim() || null,
          },
        });
        showToast('Orden actualizada.', 'success');
        await loadOrders();
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        saveButton.disabled = false;
      }
    });
    actionsCell.appendChild(saveButton);

    row.appendChild(orderCell);
    row.appendChild(customerCell);
    row.appendChild(contactCell);
    row.appendChild(statusCell);
    row.appendChild(tailorCell);
    row.appendChild(measurementsCell);
    row.appendChild(notesCell);
    row.appendChild(actionsCell);

    ordersTableBody.appendChild(row);
  });
}

async function initialise() {
  ensureMeasurementRow();
  try {
    state.statuses = await apiFetch('/statuses', { auth: false });
    populateStatusSelect(statusSelect);
  } catch (error) {
    console.error('No se pudo cargar la lista de estados', error);
  }
}

initialise();
