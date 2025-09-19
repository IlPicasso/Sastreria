const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000';

const state = {
  statuses: [],
  token: null,
  user: null,
  tailors: [],
  orders: [],
  customers: [],
  allCustomers: [],
  auditLogs: [],
  selectedCustomerId: null,
  selectedOrderId: null,

  customerSearchTerm: '',
  orderCustomerSelection: null,
  orderCustomerResults: [],
};

const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('.nav-button');
const dashboardTabButtons = document.querySelectorAll('.dashboard-tab');
const dashboardPanels = document.querySelectorAll('.dashboard-panel');
const orderLookupForm = document.getElementById('orderLookupForm');
const orderNumberInput = document.getElementById('orderNumber');
const orderDocumentInput = document.getElementById('customerDocument');
const orderResultContainer = document.getElementById('orderStatusResult');
const staffLoginForm = document.getElementById('staffLoginForm');
const staffDashboard = document.getElementById('staffDashboard');
const staffLoginCard = document.getElementById('staffLogin');
const logoutButton = document.getElementById('logoutButton');
const createOrderForm = document.getElementById('createOrderForm');
const createCustomerForm = document.getElementById('createCustomerForm');
const updateCustomerForm = document.getElementById('updateCustomerForm');
const customersTableBody = document.getElementById('customersTableBody');
const customerDetail = document.getElementById('customerDetail');
const customerMeasurementsContainer = document.getElementById('customerMeasurementsContainer');
const updateCustomerMeasurementsContainer = document.getElementById('updateCustomerMeasurementsContainer');
const addCustomerMeasurementSetButton = document.getElementById('addCustomerMeasurementSet');
const addUpdateCustomerMeasurementSetButton = document.getElementById('addUpdateCustomerMeasurementSet');
const deleteCustomerButton = document.getElementById('deleteCustomerButton');
const customerMeasurementOptions = document.getElementById('customerMeasurementOptions');
const ordersTableBody = document.getElementById('ordersTableBody');
const measurementsList = document.getElementById('measurementsList');
const addMeasurementButton = document.getElementById('addMeasurementButton');
const statusSelect = document.getElementById('newOrderStatus');
const assignTailorSelect = document.getElementById('assignTailor');
const toastElement = document.getElementById('toast');
const currentYearElement = document.getElementById('currentYear');
const currentUserNameElement = document.getElementById('currentUserName');
const currentUserRoleElement = document.getElementById('currentUserRole');
const auditLogPanel = document.getElementById('auditLogPanel');
const auditLogTableBody = document.getElementById('auditLogTableBody');
const auditLogTabButton = document.getElementById('auditLogTabButton');
const customerSearchForm = document.getElementById('customerSearchForm');
const customerSearchInput = document.getElementById('customerSearchInput');
const customerSearchClear = document.getElementById('customerSearchClear');
const orderCustomerSearchInput = document.getElementById('orderCustomerSearch');
const orderCustomerResults = document.getElementById('orderCustomerResults');
const orderCustomerIdInput = document.getElementById('orderCustomerId');
const orderCustomerClearButton = document.getElementById('orderCustomerClear');
const orderEntryDateInput = document.getElementById('newOrderEntryDate');
const orderDeliveryDateInput = document.getElementById('newOrderDeliveryDate');
const newCustomerDocumentInput = document.getElementById('newCustomerDocument');
const newCustomerNameInput = document.getElementById('newCustomerName');
const newCustomerContactInput = document.getElementById('newCustomerContact');
const orderDetailContainer = document.getElementById('orderDetail');
const orderDetailPlaceholder = document.getElementById('orderDetailEmpty');
const orderDetailTitle = document.getElementById('orderDetailTitle');
const orderDetailInfo = document.getElementById('orderDetailInfo');
const orderDetailForm = document.getElementById('orderDetailForm');
const orderDetailNumberInput = document.getElementById('orderDetailNumber');
const orderDetailStatusSelect = document.getElementById('orderDetailStatus');
const orderDetailCustomerInput = document.getElementById('orderDetailCustomer');
const orderDetailTailorSelect = document.getElementById('orderDetailTailor');
const orderDetailDocumentInput = document.getElementById('orderDetailDocument');
const orderDetailContactInput = document.getElementById('orderDetailContact');
const orderDetailEntryInput = document.getElementById('orderDetailEntryDate');
const orderDetailDeliveryInput = document.getElementById('orderDetailDeliveryDate');
const orderDetailNotesTextarea = document.getElementById('orderDetailNotes');
const orderDetailMeasurementsContainer = document.getElementById('orderDetailMeasurements');
const orderDetailCloseButton = document.getElementById('closeOrderDetail');


const ROLE_LABELS = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  sastre: 'Sastre',
};

const DELIVERY_WARNING_THRESHOLD_DAYS = 2;

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

let activeDashboardTab = 'customersListPanel';
let orderCustomerSearchTimeout = null;
let suppressOrderSearch = false;
let lastOrderSearchTerm = '';

function setActiveDashboardTab(tabId) {
  if (!tabId) return;
  let resolvedTab = tabId;
  if (resolvedTab === 'auditLogPanel' && auditLogTabButton?.classList.contains('hidden')) {
    resolvedTab = 'customersListPanel';
  }
  activeDashboardTab = resolvedTab;
  dashboardTabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === resolvedTab);
  });
  dashboardPanels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.id !== resolvedTab);
  });
}

dashboardTabButtons.forEach((btn) => {
  btn.addEventListener('click', () => setActiveDashboardTab(btn.dataset.tab));
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

function formatDateOnly(dateString) {
  if (!dateString) {
    return '—';
  }
  try {
    return new Date(dateString).toLocaleDateString('es-EC', {
      dateStyle: 'medium',
    });
  } catch (error) {
    return dateString;
  }
}

function calculateDaysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / 86400000);
}

function isDeliveryDueSoon(order) {
  if (!order?.delivery_date) return false;
  if (order.status === 'Entregado') return false;
  const daysUntil = calculateDaysUntil(order.delivery_date);
  if (daysUntil === null) return false;
  return daysUntil <= DELIVERY_WARNING_THRESHOLD_DAYS;
}

function isDeliveryOverdue(order) {
  if (!order?.delivery_date) return false;
  if (order.status === 'Entregado') return false;
  const daysUntil = calculateDaysUntil(order.delivery_date);
  if (daysUntil === null) return false;
  return daysUntil < 0;
}

function getDeliveryHighlightClasses(order) {
  if (!order) return [];
  if (isDeliveryOverdue(order)) {
    return ['deadline-warning', 'deadline-overdue'];
  }
  if (isDeliveryDueSoon(order)) {
    return ['deadline-warning'];
  }
  return [];
}

function toInputDateValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
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

function renderPublicOrderResults(orders) {
  if (!orderResultContainer) return;
  orderResultContainer.classList.remove('hidden');
  if (!orders?.length) {
    orderResultContainer.innerHTML = '<p>No se encontraron órdenes con los datos ingresados.</p>';
    return;
  }

  const listHtml = orders
    .map((order) => {
      const measurements = order.measurements?.length
        ? `<div class="measurement-tags">${order.measurements
            .map((item) => `<span class="tag">${item.nombre}: ${item.valor}</span>`)
            .join('')}</div>`
        : '<p class="muted">No hay medidas registradas.</p>';
      return `
        <article class="public-order-card">
          <header>
            <h3>Orden ${order.order_number}</h3>
            <p><strong>Cliente:</strong> ${order.customer_name}</p>
            ${order.customer_document ? `<p><strong>Documento:</strong> ${order.customer_document}</p>` : ''}
          </header>
          <p><strong>Estado:</strong> ${order.status}</p>
          ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
          <p><strong>Última actualización:</strong> ${formatDate(order.updated_at)}</p>
          ${measurements}
        </article>
      `;
    })
    .join('');

  orderResultContainer.innerHTML = `
    <h3>Resultados (${orders.length})</h3>
    <div class="public-order-list">${listHtml}</div>
  `;
}

function clearOrderResult() {
  if (!orderResultContainer) return;
  orderResultContainer.classList.add('hidden');
  orderResultContainer.innerHTML = '';
}

if (orderLookupForm) {
  orderLookupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const orderNumber = orderNumberInput?.value.trim();
    const customerDocument = orderDocumentInput?.value.trim();
    if (!orderNumber && !customerDocument) {
      showToast('Ingresa el número de orden o la cédula para continuar.', 'error');
      return;
    }
    const params = new URLSearchParams();
    if (orderNumber) params.append('order_number', orderNumber);
    if (customerDocument) params.append('customer_document', customerDocument);
    try {
      const orders = await apiFetch(`/public/orders?${params.toString()}`, { auth: false });
      renderPublicOrderResults(orders);
    } catch (error) {
      orderResultContainer.classList.remove('hidden');
      orderResultContainer.innerHTML = `<p>${error.message}</p>`;
      showToast(error.message, 'error');
    }
  });
}

function populateStatusSelect(selectElement, selectedValue = '') {
  if (!selectElement) return;
  selectElement.innerHTML = '';
  state.statuses.forEach((statusValue) => {
    const option = document.createElement('option');
    option.value = statusValue;
    option.textContent = statusValue;
    if (selectedValue && selectedValue === statusValue) {
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
  removeButton.className = 'danger ghost';
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

function addMeasurementRowToList(listElement, data = { nombre: '', valor: '' }) {
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
  removeButton.className = 'danger ghost';
  removeButton.textContent = 'Eliminar';
  removeButton.addEventListener('click', () => {
    row.remove();
    if (listElement.children.length === 0) {
      addMeasurementRowToList(listElement);
    }
  });

  row.appendChild(nameInput);
  row.appendChild(valueInput);
  row.appendChild(removeButton);
  listElement.appendChild(row);
}

function createMeasurementSetBlock(container, data = { name: '', measurements: [] }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'measurement-set';

  const header = document.createElement('div');
  header.className = 'measurement-set-header';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Nombre del conjunto (ej. Traje azul)';
  nameInput.value = data.name || '';
  nameInput.dataset.field = 'name';

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'danger ghost';
  removeButton.textContent = 'Eliminar conjunto';
  removeButton.addEventListener('click', () => {
    wrapper.remove();
  });

  header.appendChild(nameInput);
  header.appendChild(removeButton);

  const measurementList = document.createElement('div');
  measurementList.className = 'measurement-list';

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'secondary small';
  addButton.textContent = 'Agregar medida';
  addButton.addEventListener('click', () => addMeasurementRowToList(measurementList));

  wrapper.appendChild(header);
  wrapper.appendChild(measurementList);
  wrapper.appendChild(addButton);
  container.appendChild(wrapper);

  if (data.measurements?.length) {
    data.measurements.forEach((item) => addMeasurementRowToList(measurementList, item));
  } else {
    addMeasurementRowToList(measurementList);
  }
}

function collectMeasurementSets(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('.measurement-set'))
    .map((setElement) => {
      const nameInput = setElement.querySelector('input[data-field="name"]');
      const name = nameInput?.value.trim();
      const measurements = Array.from(setElement.querySelectorAll('.measurement-row'))
        .map((row) => {
          const nombre = row.querySelector('input[data-field="nombre"]').value.trim();
          const valor = row.querySelector('input[data-field="valor"]').value.trim();
          return nombre && valor ? { nombre, valor } : null;
        })
        .filter(Boolean);
      if (!name) {
        return null;
      }
      return { name, measurements };
    })
    .filter(Boolean);
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

function hideOrderCustomerResults() {
  if (!orderCustomerResults) return;
  orderCustomerResults.classList.add('hidden');
  orderCustomerResults.innerHTML = '';
}

function renderOrderCustomerResultsList(results) {
  if (!orderCustomerResults) return;
  orderCustomerResults.innerHTML = '';
  state.orderCustomerResults = results;
  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'search-empty';
    empty.textContent = 'No se encontraron coincidencias.';
    orderCustomerResults.appendChild(empty);
  } else {
    results.slice(0, 10).forEach((customer) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'search-result-item';
      const title = document.createElement('span');
      title.className = 'search-result-title';
      title.textContent = customer.full_name;
      item.appendChild(title);

      const documentLabel = document.createElement('span');
      documentLabel.className = 'search-result-meta';
      documentLabel.textContent = customer.document_id || 'Sin documento';
      item.appendChild(documentLabel);

      if (customer.phone) {
        const phoneLabel = document.createElement('span');
        phoneLabel.className = 'search-result-meta';
        phoneLabel.textContent = customer.phone;
        item.appendChild(phoneLabel);
      }
      item.addEventListener('click', () => {
        applyOrderCustomerSelection(customer);
      });
      orderCustomerResults.appendChild(item);
    });
  }
  orderCustomerResults.classList.remove('hidden');
}

function clearOrderCustomerSelection({ preserveSearchValue = false } = {}) {
  state.orderCustomerSelection = null;
  if (orderCustomerIdInput) {
    orderCustomerIdInput.value = '';
  }
  if (!preserveSearchValue && orderCustomerSearchInput) {
    orderCustomerSearchInput.value = '';
  }
  state.orderCustomerResults = [];
  lastOrderSearchTerm = '';

  hideOrderCustomerResults();
  if (orderCustomerClearButton) {
    orderCustomerClearButton.classList.add('hidden');
  }
  if (newCustomerDocumentInput) {
    newCustomerDocumentInput.value = '';
  }
  if (newCustomerNameInput) {
    newCustomerNameInput.value = '';
  }
  if (newCustomerContactInput) {
    newCustomerContactInput.value = '';
  }
  renderCustomerMeasurementOptions(null);
}

function applyOrderCustomerSelection(customer, { skipNotification = false } = {}) {
  state.orderCustomerSelection = customer;
  if (orderCustomerIdInput) {
    orderCustomerIdInput.value = customer.id ? String(customer.id) : '';
  }
  if (orderCustomerSearchInput) {
    suppressOrderSearch = true;
    orderCustomerSearchInput.value = `${customer.full_name}${
      customer.document_id ? ` (${customer.document_id})` : ''
    }`;
    setTimeout(() => {
      suppressOrderSearch = false;
    }, 0);
  }
  if (orderCustomerClearButton) {
    orderCustomerClearButton.classList.remove('hidden');
  }
  if (newCustomerDocumentInput) {
    newCustomerDocumentInput.value = customer.document_id || '';
  }
  if (newCustomerNameInput) {
    newCustomerNameInput.value = customer.full_name || '';
  }
  if (newCustomerContactInput) {
    newCustomerContactInput.value = customer.phone || '';
  }
  renderCustomerMeasurementOptions(customer);
  hideOrderCustomerResults();
  state.orderCustomerResults = [];
  if (!skipNotification) {
    showToast(`Cliente "${customer.full_name}" seleccionado.`, 'success');
  }
}

function resetCreateOrderForm() {
  if (!createOrderForm) return;
  createOrderForm.reset();
  populateStatusSelect(statusSelect);
  populateTailorSelect(assignTailorSelect);
  clearOrderCustomerSelection();
  if (orderEntryDateInput) {
    orderEntryDateInput.value = getTodayInputValue();
  }
  if (orderDeliveryDateInput) {
    orderDeliveryDateInput.value = '';
  }
  measurementsList.innerHTML = '';
  addMeasurementRow();
  renderCustomerMeasurementOptions(null);
}

function resetCreateCustomerForm() {
  if (!createCustomerForm) return;
  createCustomerForm.reset();
  if (customerMeasurementsContainer) {
    customerMeasurementsContainer.innerHTML = '';
    createMeasurementSetBlock(customerMeasurementsContainer);
  }
}

function renderCustomerMeasurementOptions(customer) {
  if (!customerMeasurementOptions) return;
  if (!customer) {
    customerMeasurementOptions.classList.add('muted');
    customerMeasurementOptions.innerHTML = 'Selecciona un cliente para ver sus medidas guardadas.';
    return;
  }
  if (!customer.measurements?.length) {
    customerMeasurementOptions.classList.add('muted');
    customerMeasurementOptions.innerHTML = 'El cliente no tiene medidas guardadas.';
    return;
  }
  customerMeasurementOptions.classList.remove('muted');
  customerMeasurementOptions.innerHTML = '';
  customer.measurements.forEach((set) => {
    const card = document.createElement('div');
    card.className = 'measurement-option';

    const header = document.createElement('div');
    header.className = 'measurement-option-header';

    const title = document.createElement('strong');
    title.textContent = set.name;

    const useButton = document.createElement('button');
    useButton.type = 'button';
    useButton.className = 'secondary small';
    useButton.textContent = 'Usar en la orden';
    useButton.addEventListener('click', () => {
      measurementsList.innerHTML = '';
      if (set.measurements?.length) {
        set.measurements.forEach((item) => addMeasurementRow(item));
      }
      ensureMeasurementRow();
      showToast(`Se aplicaron las medidas del conjunto "${set.name}".`, 'success');
    });

    header.appendChild(title);
    header.appendChild(useButton);

    const tags = document.createElement('div');
    tags.className = 'measurement-tags';
    if (set.measurements?.length) {
      set.measurements.forEach((item) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = `${item.nombre}: ${item.valor}`;
        tags.appendChild(tag);
      });
    } else {
      const empty = document.createElement('span');
      empty.className = 'muted';
      empty.textContent = 'Sin medidas registradas';
      tags.appendChild(empty);
    }

    card.appendChild(header);
    card.appendChild(tags);
    customerMeasurementOptions.appendChild(card);
  });
}
function updateUserInfo() {
  if (!state.user) return;
  if (currentUserNameElement) {
    currentUserNameElement.textContent = state.user.full_name;
  }
  if (currentUserRoleElement) {
    currentUserRoleElement.textContent = ROLE_LABELS[state.user.role] || state.user.role;
  }
  if (deleteCustomerButton) {
    if (state.user.role === 'administrador') {
      deleteCustomerButton.classList.remove('hidden');
    } else {
      deleteCustomerButton.classList.add('hidden');
    }
  }
  if (auditLogTabButton) {
    if (state.user.role === 'administrador') {
      auditLogTabButton.classList.remove('hidden');
    } else {
      auditLogTabButton.classList.add('hidden');
      if (activeDashboardTab === 'auditLogPanel') {
        setActiveDashboardTab('customersListPanel');
      }
    }
  }
  if (auditLogPanel && state.user.role !== 'administrador') {
    auditLogPanel.classList.add('hidden');
  }
}

function showDashboard() {
  if (staffDashboard) {
    staffDashboard.classList.remove('hidden');
  }
  if (staffLoginCard) {
    staffLoginCard.classList.add('hidden');
  }
  setActiveDashboardTab(activeDashboardTab || 'customersListPanel');
}

function hideDashboard() {
  if (staffDashboard) {
    staffDashboard.classList.add('hidden');
  }
  if (staffLoginCard) {
    staffLoginCard.classList.remove('hidden');
  }
  activeDashboardTab = 'customersListPanel';
  setActiveDashboardTab(activeDashboardTab);
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
    updateUserInfo();
    await loadStatuses();
    await loadTailors();
    await loadCustomers();
    await loadOrders();
    if (state.user?.role === 'administrador') {
      await loadAuditLogs();
    }
    showDashboard();
    resetCreateCustomerForm();
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
  const currentStatus =
    state.selectedOrderId != null
      ? state.orders.find((order) => order.id === state.selectedOrderId)?.status ?? ''
      : orderDetailStatusSelect?.value ?? '';
  populateStatusSelect(orderDetailStatusSelect, currentStatus);
}

async function loadTailors() {
  if (!state.token) return;
  try {
    state.tailors = await apiFetch('/users/tailors');
  } catch (error) {
    showToast(error.message, 'error');
  }
  populateTailorSelect(assignTailorSelect);
  const currentTailorId =
    state.selectedOrderId != null
      ? state.orders.find((order) => order.id === state.selectedOrderId)?.assigned_tailor?.id ?? ''
      : orderDetailTailorSelect?.value ?? '';
  populateTailorSelect(orderDetailTailorSelect, currentTailorId);
}

async function loadOrders() {
  if (!state.token) return;
  try {
    state.orders = await apiFetch('/orders');
    renderOrders();
    if (state.selectedOrderId != null) {
      const selectedOrder = state.orders.find((order) => order.id === state.selectedOrderId);
      if (selectedOrder) {
        populateOrderDetail(selectedOrder, { preserveSelection: true });
      } else {
        clearOrderDetail();
      }
    } else {
      highlightSelectedOrderRow();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadCustomers(searchTerm = '') {
  if (!state.token) return;
  try {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    const customers = await apiFetch(`/customers${params.toString() ? `?${params.toString()}` : ''}`);
    if (!searchTerm) {
      state.allCustomers = customers;
    }
    state.customers = customers;
    state.customerSearchTerm = searchTerm;
    renderCustomers();
    if (state.selectedCustomerId) {
      const selected = state.customers.find((customer) => customer.id === state.selectedCustomerId);
      if (selected) {
        populateCustomerDetail(selected);
      } else {
        clearCustomerDetail();
      }
    } else {
      clearCustomerDetail();
    }
    if (state.orderCustomerSelection && !searchTerm) {
      const updated = state.customers.find((customer) => customer.id === state.orderCustomerSelection?.id);
      if (updated) {
        state.orderCustomerSelection = updated;
        applyOrderCustomerSelection(updated, { skipNotification: true });
      } else {
        clearOrderCustomerSelection({ preserveSearchValue: true });
      }
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadAuditLogs() {
  if (!state.token || state.user?.role !== 'administrador') return;
  try {
    state.auditLogs = await apiFetch('/audit-logs');
    renderAuditLogs();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadCurrentUser() {
  state.user = await apiFetch('/users/me');
}

function handleLogout(auto = false) {
  state.token = null;
  state.user = null;
  state.orders = [];
  state.tailors = [];
  state.customers = [];
  state.allCustomers = [];
  state.auditLogs = [];
  state.selectedCustomerId = null;
  state.selectedOrderId = null;

  state.customerSearchTerm = '';
  state.orderCustomerSelection = null;
  state.orderCustomerResults = [];
  if (assignTailorSelect) {
    populateTailorSelect(assignTailorSelect);
  }
  hideDashboard();
  if (ordersTableBody) {
    ordersTableBody.innerHTML = '';
  }
  clearOrderDetail();
  if (customersTableBody) {
    customersTableBody.innerHTML = '';
  }
  if (auditLogTableBody) {
    auditLogTableBody.innerHTML = '';
  }
  if (customerSearchInput) {
    customerSearchInput.value = '';
  }
  clearCustomerDetail();
  resetCreateCustomerForm();
  measurementsList.innerHTML = '';
  ensureMeasurementRow();
  renderCustomerMeasurementOptions(null);
  clearOrderCustomerSelection();
  if (orderEntryDateInput) {
    orderEntryDateInput.value = '';
  }
  if (orderDeliveryDateInput) {
    orderDeliveryDateInput.value = '';
  }
  hideOrderCustomerResults();
  clearOrderResult();
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
function renderCustomers() {
  if (!customersTableBody) return;
  customersTableBody.innerHTML = '';
  if (customerSearchInput && customerSearchInput.value !== state.customerSearchTerm) {
    customerSearchInput.value = state.customerSearchTerm;
  }
  if (!state.customers.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = state.customerSearchTerm
      ? `No se encontraron clientes que coincidan con "${state.customerSearchTerm}".`
      : 'No hay clientes registrados aún.';
    cell.className = 'muted';
    row.appendChild(cell);
    customersTableBody.appendChild(row);
    return;
  }

  state.customers.forEach((customer) => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = customer.full_name;

    const documentCell = document.createElement('td');
    documentCell.textContent = customer.document_id;

    const phoneCell = document.createElement('td');
    phoneCell.textContent = customer.phone || '—';

    const measurementsCell = document.createElement('td');
    measurementsCell.textContent = `${customer.measurements?.length || 0}`;

    const actionsCell = document.createElement('td');
    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.className = 'secondary';
    viewButton.textContent = 'Ver detalle';
    viewButton.addEventListener('click', () => {
      populateCustomerDetail(customer);
    });
    actionsCell.appendChild(viewButton);

    row.appendChild(nameCell);
    row.appendChild(documentCell);
    row.appendChild(phoneCell);
    row.appendChild(measurementsCell);
    row.appendChild(actionsCell);

    customersTableBody.appendChild(row);
  });
}

function populateCustomerDetail(customer) {
  if (!customerDetail) return;
  state.selectedCustomerId = customer.id;
  customerDetail.classList.remove('hidden');
  document.getElementById('updateCustomerName').value = customer.full_name;
  document.getElementById('updateCustomerDocument').value = customer.document_id;
  document.getElementById('updateCustomerPhone').value = customer.phone || '';
  if (updateCustomerMeasurementsContainer) {
    updateCustomerMeasurementsContainer.innerHTML = '';
    if (customer.measurements?.length) {
      customer.measurements.forEach((set) => {
        createMeasurementSetBlock(updateCustomerMeasurementsContainer, set);
      });
    } else {
      createMeasurementSetBlock(updateCustomerMeasurementsContainer);
    }
  }
}

function clearCustomerDetail() {
  if (!customerDetail) return;
  customerDetail.classList.add('hidden');
  state.selectedCustomerId = null;
  updateCustomerForm?.reset();
  if (updateCustomerMeasurementsContainer) {
    updateCustomerMeasurementsContainer.innerHTML = '';
  }
}

if (addCustomerMeasurementSetButton) {
  addCustomerMeasurementSetButton.addEventListener('click', () => {
    createMeasurementSetBlock(customerMeasurementsContainer);
  });
}

if (addUpdateCustomerMeasurementSetButton) {
  addUpdateCustomerMeasurementSetButton.addEventListener('click', () => {
    createMeasurementSetBlock(updateCustomerMeasurementsContainer);
  });
}

if (customerSearchForm) {
  customerSearchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const term = customerSearchInput?.value.trim() || '';
    await loadCustomers(term);
  });
}

if (customerSearchClear) {
  customerSearchClear.addEventListener('click', async () => {
    if (customerSearchInput) {
      customerSearchInput.value = '';
      customerSearchInput.focus();
    }
    await loadCustomers();
  });
}

if (createCustomerForm) {
  createCustomerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fullName = document.getElementById('customerFullName').value.trim();
    const documentId = document.getElementById('customerDocumentInput').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    if (!fullName || !documentId) {
      showToast('El nombre y la cédula del cliente son obligatorios.', 'error');
      return;
    }
    const measurements = collectMeasurementSets(customerMeasurementsContainer);
    const submitButton = createCustomerForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      await apiFetch('/customers', {
        method: 'POST',
        body: {
          full_name: fullName,
          document_id: documentId,
          phone: phone || null,
          measurements,
        },
      });
      await loadCustomers(state.customerSearchTerm);
      resetCreateCustomerForm();
      showToast('Cliente registrado correctamente.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });
}

if (updateCustomerForm) {
  updateCustomerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedCustomerId) {
      showToast('Selecciona un cliente para actualizar.', 'error');
      return;
    }
    const fullName = document.getElementById('updateCustomerName').value.trim();
    const documentId = document.getElementById('updateCustomerDocument').value.trim();
    const phone = document.getElementById('updateCustomerPhone').value.trim();
    const measurements = collectMeasurementSets(updateCustomerMeasurementsContainer);
    const submitButton = updateCustomerForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      await apiFetch(`/customers/${state.selectedCustomerId}`, {
        method: 'PATCH',
        body: {
          full_name: fullName || null,
          document_id: documentId || null,
          phone: phone || null,
          measurements,
        },
      });
      await loadCustomers(state.customerSearchTerm);
      const refreshed = state.customers.find((customer) => customer.id === state.selectedCustomerId);
      if (refreshed) {
        populateCustomerDetail(refreshed);
      }
      showToast('Cliente actualizado correctamente.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });
}

if (deleteCustomerButton) {
  deleteCustomerButton.addEventListener('click', async () => {
    if (!state.selectedCustomerId) return;
    if (!confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await apiFetch(`/customers/${state.selectedCustomerId}`, { method: 'DELETE' });
      showToast('Cliente eliminado correctamente.', 'success');
      state.selectedCustomerId = null;
      await loadCustomers(state.customerSearchTerm);
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}
async function createOrder(event) {
  event.preventDefault();
  const newOrderNumber = document.getElementById('newOrderNumber').value.trim();
  const selectedCustomerId = orderCustomerIdInput?.value ? Number(orderCustomerIdInput.value) : NaN;
  const newCustomerName = newCustomerNameInput?.value.trim() || '';
  const newCustomerDocument = newCustomerDocumentInput?.value.trim() || '';
  const newCustomerContact = newCustomerContactInput?.value.trim() || '';
  const newOrderStatus = document.getElementById('newOrderStatus').value;
  const newOrderNotes = document.getElementById('newOrderNotes').value.trim();
  const assignedTailorId = assignTailorSelect.value ? Number(assignTailorSelect.value) : null;
  const measurements = collectMeasurements();
  const entryDateValue = orderEntryDateInput?.value;
  const deliveryDateValue = orderDeliveryDateInput?.value;

  if (!selectedCustomerId || Number.isNaN(selectedCustomerId)) {
    showToast('Selecciona un cliente para registrar la orden.', 'error');
    return;
  }

  if (!entryDateValue) {
    showToast('La fecha de ingreso de la orden es obligatoria.', 'error');
    return;
  }

  const submitButton = createOrderForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    await apiFetch('/orders', {
      method: 'POST',
      body: {
        order_number: newOrderNumber,
        customer_id: selectedCustomerId,
        customer_name: newCustomerName || null,
        customer_document: newCustomerDocument || null,
        customer_contact: newCustomerContact || null,
        status: newOrderStatus,
        notes: newOrderNotes || null,
        measurements,
        assigned_tailor_id: assignedTailorId,
        entry_date: entryDateValue,
        delivery_date: deliveryDateValue || null,
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

if (orderCustomerClearButton) {
  orderCustomerClearButton.addEventListener('click', () => {
    clearOrderCustomerSelection();
    if (orderCustomerSearchInput) {
      orderCustomerSearchInput.focus();
    }
  });
}

if (orderCustomerSearchInput) {
  orderCustomerSearchInput.addEventListener('input', (event) => {
    if (suppressOrderSearch) return;
    const term = event.target.value.trim();
    const normalizedTerm = term.toLowerCase();
    if (state.orderCustomerSelection) {
      clearOrderCustomerSelection({ preserveSearchValue: true });
    }
    if (orderCustomerSearchTimeout) {
      clearTimeout(orderCustomerSearchTimeout);
    }
    if (term.length < 2) {
      state.orderCustomerResults = [];
      lastOrderSearchTerm = '';
      if (!term) {
        hideOrderCustomerResults();
      }
      return;
    }
    if (normalizedTerm === lastOrderSearchTerm && state.orderCustomerResults.length) {
      orderCustomerResults?.classList.remove('hidden');
      return;
    }
    orderCustomerSearchTimeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: term });
        const results = await apiFetch(`/customers?${params.toString()}`);
        lastOrderSearchTerm = normalizedTerm;
        renderOrderCustomerResultsList(results);
      } catch (error) {
        lastOrderSearchTerm = '';
        hideOrderCustomerResults();
        showToast(error.message, 'error');
      }
    }, 250);
  });

  orderCustomerSearchInput.addEventListener('focus', () => {
    if (state.orderCustomerResults.length) {
      renderOrderCustomerResultsList(state.orderCustomerResults);
    }
  });
}

document.addEventListener('click', (event) => {
  if (!orderCustomerResults || !orderCustomerSearchInput) return;
  if (
    orderCustomerResults.contains(event.target) ||
    orderCustomerSearchInput.contains(event.target) ||
    orderCustomerClearButton?.contains(event.target)
  ) {
    return;
  }
  hideOrderCustomerResults();
});

function renderOrderDetailMeasurements(measurements) {
  if (!orderDetailMeasurementsContainer) return;
  orderDetailMeasurementsContainer.innerHTML = '';
  if (!measurements?.length) {
    orderDetailMeasurementsContainer.classList.add('muted');
    orderDetailMeasurementsContainer.textContent = 'Sin medidas registradas.';
    return;
  }
  orderDetailMeasurementsContainer.classList.remove('muted');
  const tagsWrapper = document.createElement('div');
  tagsWrapper.className = 'measurement-tags';
  measurements.forEach((item) => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    const name = item?.nombre ?? item?.name ?? 'Medida';
    const value = item?.valor ?? item?.value ?? '';
    const hasValue = value !== null && value !== undefined && value !== '';
    tag.textContent = hasValue ? `${name}: ${value}` : name;
    tagsWrapper.appendChild(tag);
  });
  orderDetailMeasurementsContainer.appendChild(tagsWrapper);
}

function populateOrderDetail(order, { preserveSelection = false } = {}) {
  if (!orderDetailForm || !orderDetailContainer) return;
  if (!preserveSelection) {
    state.selectedOrderId = order.id;
  }
  orderDetailForm.dataset.orderId = String(order.id);
  if (orderDetailNumberInput) {
    orderDetailNumberInput.value = order.order_number || '';
  }
  if (orderDetailCustomerInput) {
    orderDetailCustomerInput.value = order.customer_name || order.customer?.full_name || '';
  }
  if (orderDetailDocumentInput) {
    orderDetailDocumentInput.value = order.customer_document || order.customer?.document_id || '';
  }
  if (orderDetailContactInput) {
    orderDetailContactInput.value = order.customer_contact || order.customer?.phone || '';
  }
  if (orderDetailEntryInput) {
    orderDetailEntryInput.value = toInputDateValue(order.entry_date || order.created_at);
  }
  if (orderDetailDeliveryInput) {
    orderDetailDeliveryInput.value = toInputDateValue(order.delivery_date);
  }
  populateStatusSelect(orderDetailStatusSelect, order.status);
  const assignedTailorId = order.assigned_tailor?.id ?? '';
  populateTailorSelect(orderDetailTailorSelect, assignedTailorId);
  if (orderDetailNotesTextarea) {
    orderDetailNotesTextarea.value = order.notes || '';
  }
  renderOrderDetailMeasurements(order.measurements);
  if (orderDetailTitle) {
    orderDetailTitle.textContent = order.order_number ? `Orden ${order.order_number}` : 'Detalle de la orden';
  }
  if (orderDetailInfo) {
    const infoParts = [];
    if (order.customer_name) {
      infoParts.push(`Cliente: ${order.customer_name}`);
    }
    if (order.status) {
      infoParts.push(`Estado: ${order.status}`);
    }
    orderDetailInfo.textContent = infoParts.join(' • ');
  }
  orderDetailContainer.classList.remove('hidden');
  orderDetailPlaceholder?.classList.add('hidden');
  highlightSelectedOrderRow();
}

function showOrderDetail(orderId) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return;
  state.selectedOrderId = order.id;
  populateOrderDetail(order, { preserveSelection: true });
}

function clearOrderDetail() {
  state.selectedOrderId = null;
  if (orderDetailForm) {
    orderDetailForm.dataset.orderId = '';
  }
  if (orderDetailNumberInput) orderDetailNumberInput.value = '';
  if (orderDetailCustomerInput) orderDetailCustomerInput.value = '';
  if (orderDetailDocumentInput) orderDetailDocumentInput.value = '';
  if (orderDetailContactInput) orderDetailContactInput.value = '';
  if (orderDetailEntryInput) orderDetailEntryInput.value = '';
  if (orderDetailDeliveryInput) orderDetailDeliveryInput.value = '';
  if (orderDetailNotesTextarea) orderDetailNotesTextarea.value = '';
  renderOrderDetailMeasurements(null);
  if (orderDetailTitle) {
    orderDetailTitle.textContent = 'Detalle de la orden';
  }
  if (orderDetailInfo) {
    orderDetailInfo.textContent = '';
  }
  orderDetailContainer?.classList.add('hidden');
  if (orderDetailPlaceholder) {
    orderDetailPlaceholder.classList.remove('hidden');
    orderDetailPlaceholder.textContent = 'Selecciona una orden para ver toda la información.';
  }
  highlightSelectedOrderRow();
=======
}

if (orderCustomerSearchInput) {
  orderCustomerSearchInput.addEventListener('input', (event) => {
    if (suppressOrderSearch) return;
    const term = event.target.value.trim();
    if (state.orderCustomerSelection) {
      clearOrderCustomerSelection({ preserveSearchValue: true });
    }
    if (orderCustomerSearchTimeout) {
      clearTimeout(orderCustomerSearchTimeout);
    }
    if (term.length < 2) {
      state.orderCustomerResults = [];
      if (!term) {
        hideOrderCustomerResults();
      }
      return;
    }
    orderCustomerSearchTimeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: term });
        const results = await apiFetch(`/customers?${params.toString()}`);
        renderOrderCustomerResultsList(results);
      } catch (error) {
        hideOrderCustomerResults();
        showToast(error.message, 'error');
      }
    }, 250);
  });

  orderCustomerSearchInput.addEventListener('focus', () => {
    if (state.orderCustomerResults.length) {
      renderOrderCustomerResultsList(state.orderCustomerResults);
    }
  });
}

document.addEventListener('click', (event) => {
  if (!orderCustomerResults || !orderCustomerSearchInput) return;
  if (
    orderCustomerResults.contains(event.target) ||
    orderCustomerSearchInput.contains(event.target) ||
    orderCustomerClearButton?.contains(event.target)
  ) {
    return;
  }
  hideOrderCustomerResults();
});

function createStatusSelect(currentStatus) {
  const select = document.createElement('select');
  populateStatusSelect(select, currentStatus);
  return select;
}

function highlightSelectedOrderRow() {
  if (!ordersTableBody) return;
  const rows = ordersTableBody.querySelectorAll('tr');
  rows.forEach((row) => {
    row.classList.toggle(
      'order-row-selected',
      state.selectedOrderId != null && row.dataset.orderId === String(state.selectedOrderId),
    );
  });
}

function renderOrders() {
  if (!ordersTableBody) return;
  ordersTableBody.innerHTML = '';
  if (!state.orders.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 11;
    cell.textContent = 'No hay órdenes registradas todavía.';
    cell.className = 'muted';
    row.appendChild(cell);
    ordersTableBody.appendChild(row);
    clearOrderDetail();
    if (orderDetailPlaceholder) {
      orderDetailPlaceholder.textContent = 'No hay órdenes disponibles.';
    }
    return;
  }

  if (orderDetailPlaceholder) {
    orderDetailPlaceholder.textContent = 'Selecciona una orden para ver toda la información.';
  }

  state.orders.forEach((order) => {
    const row = document.createElement('tr');
    row.dataset.orderId = String(order.id);
    row.classList.add('order-row');

    const entryDateRaw = order.entry_date || order.created_at;
    const highlightClasses = getDeliveryHighlightClasses(order);

    const entryDateRaw = order.entry_date || order.created_at;
    const orderCell = document.createElement('td');
    orderCell.innerHTML = `<strong>${order.order_number}</strong>`;


    const customerCell = document.createElement('td');
    customerCell.textContent = order.customer_name;

    const entryCell = document.createElement('td');
    entryCell.textContent = formatDateOnly(entryDateRaw);

    const deliveryCell = document.createElement('td');
    deliveryCell.textContent = formatDateOnly(order.delivery_date);

    highlightClasses.forEach((className) => {
      orderCell.classList.add(className);
      deliveryCell.classList.add(className);
    });

    row.appendChild(orderCell);
    row.appendChild(customerCell);
    row.appendChild(entryCell);
    row.appendChild(deliveryCell);

    row.tabIndex = 0;
    row.setAttribute('aria-label', `Abrir orden ${order.order_number}`);

    row.addEventListener('click', () => {
      showOrderDetail(order.id);
    });
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showOrderDetail(order.id);
      }
    });

    ordersTableBody.appendChild(row);
  });

  highlightSelectedOrderRow();
}

if (orderDetailForm) {
  orderDetailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const orderId = Number(orderDetailForm.dataset.orderId);
    if (!orderId) {
      showToast('Selecciona una orden para actualizar.', 'error');
      return;
    }
    if (!orderDetailEntryInput?.value) {
      showToast('La fecha de ingreso no puede estar vacía.', 'error');
      return;
    }
    const submitButton = orderDetailForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }
    const payload = {
      status: orderDetailStatusSelect?.value,
      assigned_tailor_id: orderDetailTailorSelect?.value
        ? Number(orderDetailTailorSelect.value)
        : null,
      customer_contact: orderDetailContactInput?.value.trim() || null,
      notes: orderDetailNotesTextarea?.value.trim() || null,
      entry_date: orderDetailEntryInput.value,
      delivery_date: orderDetailDeliveryInput?.value || null,
    };
    try {
      await apiFetch(`/orders/${orderId}`, {
        method: 'PATCH',
        body: payload,
      });
      showToast('Orden actualizada.', 'success');
      await loadOrders();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

if (orderDetailCloseButton) {
  orderDetailCloseButton.addEventListener('click', () => {
    clearOrderDetail();
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (orderDetailContainer?.classList.contains('hidden')) return;
  clearOrderDetail();
});

if (orderDetailStatusSelect) {
  orderDetailStatusSelect.addEventListener('change', () => {
    if (!orderDetailInfo) return;
    const parts = [];
    if (orderDetailCustomerInput?.value) {
      parts.push(`Cliente: ${orderDetailCustomerInput.value}`);
    }
    if (orderDetailStatusSelect.value) {
      parts.push(`Estado: ${orderDetailStatusSelect.value}`);
    }
    orderDetailInfo.textContent = parts.join(' • ');
  });
}

function renderAuditLogs() {
  if (!auditLogTableBody) return;
  auditLogTableBody.innerHTML = '';
  if (!state.auditLogs.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = 'No hay registros disponibles aún.';
    cell.className = 'muted';
    row.appendChild(cell);
    auditLogTableBody.appendChild(row);
    return;
  }

  state.auditLogs.forEach((entry) => {
    const row = document.createElement('tr');

    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(entry.timestamp);

    const actorCell = document.createElement('td');
    actorCell.textContent = entry.actor ? entry.actor.full_name : 'Sistema';

    const actionCell = document.createElement('td');
    actionCell.textContent = entry.action;

    const entityCell = document.createElement('td');
    entityCell.textContent = entry.entity_id ? `${entry.entity_type} (#${entry.entity_id})` : entry.entity_type;

    const beforeCell = document.createElement('td');
    if (entry.before && Object.keys(entry.before).length) {
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(entry.before, null, 2);
      beforeCell.appendChild(pre);
    } else {
      beforeCell.innerHTML = '<span class="muted">Sin datos</span>';
    }

    const afterCell = document.createElement('td');
    if (entry.after && Object.keys(entry.after).length) {
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(entry.after, null, 2);
      afterCell.appendChild(pre);
    } else {
      afterCell.innerHTML = '<span class="muted">Sin datos</span>';
    }

    row.appendChild(dateCell);
    row.appendChild(actorCell);
    row.appendChild(actionCell);
    row.appendChild(entityCell);
    row.appendChild(beforeCell);
    row.appendChild(afterCell);

    auditLogTableBody.appendChild(row);
  });
}

function initialise() {
  ensureMeasurementRow();
  if (customerMeasurementsContainer && !customerMeasurementsContainer.children.length) {
    createMeasurementSetBlock(customerMeasurementsContainer);
  }
  if (orderEntryDateInput && !orderEntryDateInput.value) {
    orderEntryDateInput.value = getTodayInputValue();
  }
}

initialise();
