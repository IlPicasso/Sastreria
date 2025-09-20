const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000';
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
const ESTABLISHMENTS = ['Urdesa', 'Batan', 'Indie'];


const state = {
  statuses: [],
  token: null,
  user: null,
  tailors: [],
  orders: [],
  customers: [],
  customerSearchTerm: '',
  orderSearchTerm: '',
  customerPage: 1,
  customerPageSize: DEFAULT_PAGE_SIZE,
  orderPage: 1,
  orderPageSize: DEFAULT_PAGE_SIZE,
  isCreateCustomerVisible: false,
  auditLogs: [],
  selectedCustomerId: null,
  selectedOrderId: null,
};

const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('.nav-button');
const panelNavButton = document.getElementById('panelNavButton');
const loginNavButton = document.getElementById('loginNavButton');
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
const customerSearchInput = document.getElementById('customerSearchInput');
const showCreateCustomerButton = document.getElementById('showCreateCustomerButton');
const createCustomerSection = document.getElementById('createCustomerSection');
const closeCreateCustomerButton = document.getElementById('closeCreateCustomerButton');
const customersTableBody = document.getElementById('customersTableBody');
const customerPageSizeSelect = document.getElementById('customerPageSize');
const customerPrevPageButton = document.getElementById('customerPrevPage');
const customerNextPageButton = document.getElementById('customerNextPage');
const customerPaginationInfo = document.getElementById('customerPaginationInfo');
const customerDetail = document.getElementById('customerDetail');
const customerDetailTitle = document.getElementById('customerDetailTitle');
const customerDetailSummaryElement = document.getElementById('customerDetailSummary');
const customerOrderHistoryContainer = document.getElementById('customerOrderHistory');
const customerMeasurementsContainer = document.getElementById('customerMeasurementsContainer');
const updateCustomerMeasurementsContainer = document.getElementById('updateCustomerMeasurementsContainer');
const addCustomerMeasurementSetButton = document.getElementById('addCustomerMeasurementSet');
const addUpdateCustomerMeasurementSetButton = document.getElementById('addUpdateCustomerMeasurementSet');
const deleteCustomerButton = document.getElementById('deleteCustomerButton');
const orderCustomerSelect = document.getElementById('orderCustomerSelect');
const customerMeasurementOptions = document.getElementById('customerMeasurementOptions');
const ordersTableBody = document.getElementById('ordersTableBody');
const orderPageSizeSelect = document.getElementById('orderPageSize');
const orderPrevPageButton = document.getElementById('orderPrevPage');
const orderNextPageButton = document.getElementById('orderNextPage');
const orderPaginationInfo = document.getElementById('orderPaginationInfo');
const orderSearchInput = document.getElementById('orderSearchInput');
const measurementsList = document.getElementById('measurementsList');
const addMeasurementButton = document.getElementById('addMeasurementButton');
const statusSelect = document.getElementById('newOrderStatus');
const assignTailorSelect = document.getElementById('assignTailor');
const newOrderInvoiceInput = document.getElementById('newOrderInvoice');
const newOrderOriginSelect = document.getElementById('newOrderOrigin');
const newOrderDeliveryDateInput = document.getElementById('newOrderDeliveryDate');
const orderDetail = document.getElementById('orderDetail');
const updateOrderForm = document.getElementById('updateOrderForm');
const orderDetailNumberElement = document.getElementById('orderDetailNumber');
const orderDetailCreatedAtElement = document.getElementById('orderDetailCreatedAt');
const orderDetailUpdatedAtElement = document.getElementById('orderDetailUpdatedAt');
const orderDetailCustomerInput = document.getElementById('orderDetailCustomer');
const orderDetailDocumentInput = document.getElementById('orderDetailDocument');
const orderDetailContactInput = document.getElementById('orderDetailContact');
const orderDetailStatusSelect = document.getElementById('orderDetailStatus');
const orderDetailTailorSelect = document.getElementById('orderDetailTailor');
const orderDetailInvoiceInput = document.getElementById('orderDetailInvoice');
const orderDetailOriginSelect = document.getElementById('orderDetailOrigin');
const orderDetailDeliveryDateInput = document.getElementById('orderDetailDeliveryDate');
const orderDetailNotesTextarea = document.getElementById('orderDetailNotes');
const orderDetailMeasurementsContainer = document.getElementById('orderDetailMeasurements');
const closeOrderDetailButton = document.getElementById('closeOrderDetailButton');
const toastElement = document.getElementById('toast');
const currentYearElement = document.getElementById('currentYear');
const currentUserNameElement = document.getElementById('currentUserName');
const currentUserRoleElement = document.getElementById('currentUserRole');
const auditLogTabButton = document.getElementById('auditLogTabButton');
const auditLogTableBody = document.getElementById('auditLogTableBody');
const closeCustomerDetailButton = document.getElementById('closeCustomerDetailButton');

const ROLE_LABELS = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  sastre: 'Sastre',
};

const DELIVERY_WARNING_DAYS = 2;
const CUSTOMER_DETAIL_DEFAULT_TITLE = 'Detalle del cliente';
const CUSTOMER_DETAIL_DEFAULT_SUMMARY = 'Selecciona un cliente para ver su información.';
const CUSTOMER_ORDER_HISTORY_PROMPT = 'Selecciona un cliente para ver sus órdenes anteriores.';
const CUSTOMER_ORDER_HISTORY_EMPTY_MESSAGE = 'No tiene órdenes registradas.';

let activeDashboardTab = 'orderListPanel';
const ORDER_TABLE_COLUMN_COUNT = 6;
const CUSTOMER_TABLE_COLUMN_COUNT = 5;
let activeOrderDetailRow = null;
let activeCustomerDetailRow = null;


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
  if (loginNavButton) {
    const shouldHighlightLogin = viewId === 'staff-view' && !state.token;
    loginNavButton.classList.toggle('active', shouldHighlightLogin);
  }
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => setActiveView(btn.dataset.view));
});

if (loginNavButton) {
  loginNavButton.addEventListener('click', () => {
    setActiveView('staff-view');
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
      usernameInput.focus();
    }
  });
}

function setActiveDashboardTab(tabId = 'orderListPanel') {
  if (!dashboardPanels.length) return;
  let targetTab = tabId || 'orderListPanel';
  if (targetTab === 'auditLogPanel' && state.user?.role !== 'administrador') {
    targetTab = 'orderListPanel';
  }
  activeDashboardTab = targetTab;
  dashboardTabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === targetTab);
  });
  dashboardPanels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.id !== targetTab);
  });
}

dashboardTabButtons.forEach((btn) => {
  btn.addEventListener('click', () => setActiveDashboardTab(btn.dataset.tab));
});

setActiveDashboardTab(activeDashboardTab);

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
  try {
    return new Date(dateString).toLocaleDateString('es-EC', {
      dateStyle: 'medium',
    });
  } catch (error) {
    return dateString;
  }
}

function formatDateTimeForInput(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toInputDateTimeValue(value) {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return formatDateTimeForInput(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})/);
    if (match) {
      const [, datePart, hourPart, minutePart] = match;
      return `${datePart}T${hourPart}:${minutePart}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T00:00`;
    }
    const parsed = new Date(trimmed);
    return formatDateTimeForInput(parsed);
  }

  if (typeof value === 'number') {
    return formatDateTimeForInput(new Date(value));
  }

  return '';
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isOrderDelivered(status) {
  return typeof status === 'string' && status.trim().toLowerCase() === 'entregado';
}

function isDeliveryDateOverdue(deliveryDateString, status) {
  if (!deliveryDateString || isOrderDelivered(status)) {
    return false;
  }
  const deliveryDate = new Date(deliveryDateString);
  if (Number.isNaN(deliveryDate.getTime())) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deliveryDate.setHours(0, 0, 0, 0);
  return deliveryDate.getTime() < today.getTime();
}

function isDeliveryDateClose(deliveryDateString, status) {
  if (!deliveryDateString || isOrderDelivered(status)) {
    return false;
  }
  const deliveryDate = new Date(deliveryDateString);
  if (Number.isNaN(deliveryDate.getTime())) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deliveryDate.setHours(0, 0, 0, 0);
  const diffInDays = (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays >= 0 && diffInDays <= DELIVERY_WARNING_DAYS;
}

function hasExplicitTimeComponent(value) {
  if (!value) {
    return false;
  }
  if (value instanceof Date) {
    return true;
  }
  if (typeof value === 'string') {
    return /T\d{2}:\d{2}| \d{2}:\d{2}/.test(value);
  }
  return false;
}

function formatDeliveryDateDisplay(order) {
  if (!order?.delivery_date) {
    return '';
  }
  const deliveryValue = order.delivery_date;
  if (hasExplicitTimeComponent(deliveryValue)) {
    return formatDate(deliveryValue);
  }
  const dateLabel = formatDateOnly(deliveryValue);
  if (isOrderDelivered(order.status) && order.updated_at) {
    const updated = new Date(order.updated_at);
    if (!Number.isNaN(updated.getTime())) {
      const timeLabel = updated.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateLabel} · ${timeLabel}`;
    }
  }
  return dateLabel;
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
      const deliveryLabel = order.delivery_date
        ? formatDeliveryDateDisplay(order) || formatDateOnly(order.delivery_date)
        : '';
      const deliveryInfo = deliveryLabel
        ? `<p><strong>Fecha tentativa de entrega:</strong> ${deliveryLabel}</p>`
        : `<p><strong>Fecha tentativa de entrega:</strong> <span class="muted">Sin definir</span></p>`;
      return `
        <article class="public-order-card">
          <header>
            <h3>Orden ${order.order_number}</h3>
            <p><strong>Cliente:</strong> ${order.customer_name}</p>
            ${order.customer_document ? `<p><strong>Documento:</strong> ${order.customer_document}</p>` : ''}
          </header>
          <p><strong>Estado:</strong> ${order.status}</p>
          ${deliveryInfo}
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

function populateEstablishmentSelect(selectElement, selectedValue = '') {
  if (!selectElement) return;
  const normalizedSelected = selectedValue || '';
  selectElement.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona un establecimiento';
  placeholder.disabled = true;
  placeholder.hidden = true;
  if (!normalizedSelected) {
    placeholder.selected = true;
  }
  selectElement.appendChild(placeholder);

  ESTABLISHMENTS.forEach((branch) => {
    const option = document.createElement('option');
    option.value = branch;
    option.textContent = branch;
    if (branch === normalizedSelected) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

function populateCustomerSelect(selectElement, selectedId = '') {
  if (!selectElement) return;
  selectElement.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona un cliente';
  selectElement.appendChild(placeholder);
  state.customers.forEach((customer) => {
    const option = document.createElement('option');
    option.value = String(customer.id);
    option.textContent = `${customer.full_name} (${customer.document_id})`;
    if (selectedId && String(selectedId) === String(customer.id)) {
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

function resetCreateOrderForm() {
  if (!createOrderForm) return;
  createOrderForm.reset();
  populateStatusSelect(statusSelect);
  populateTailorSelect(assignTailorSelect);
  populateEstablishmentSelect(newOrderOriginSelect);
  populateCustomerSelect(orderCustomerSelect);
  const documentInput = document.getElementById('newCustomerDocument');
  const nameInput = document.getElementById('newCustomerName');
  const contactInput = document.getElementById('newCustomerContact');
  if (newOrderInvoiceInput) newOrderInvoiceInput.value = '';
  if (documentInput) documentInput.value = '';
  if (nameInput) nameInput.value = '';
  if (contactInput) contactInput.value = '';
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

function setCreateCustomerVisible(visible) {
  if (!createCustomerSection) return;
  state.isCreateCustomerVisible = visible;
  createCustomerSection.classList.toggle('hidden', !visible);
  if (showCreateCustomerButton) {
    showCreateCustomerButton.classList.toggle('hidden', visible);
  }
  if (visible) {
    if (customerMeasurementsContainer && !customerMeasurementsContainer.children.length) {
      createMeasurementSetBlock(customerMeasurementsContainer);
    }
    createCustomerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const firstField = createCustomerForm?.querySelector('input, textarea, select');
    firstField?.focus();
  } else {
    resetCreateCustomerForm();
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
  const isAdmin = state.user.role === 'administrador';
  if (auditLogTabButton) {
    auditLogTabButton.classList.toggle('hidden', !isAdmin);
  }
  if (!isAdmin && activeDashboardTab === 'auditLogPanel') {
    setActiveDashboardTab('orderListPanel');
  }
}

function showDashboard() {
  if (staffDashboard) {
    staffDashboard.classList.remove('hidden');
  }
  if (staffLoginCard) {
    staffLoginCard.classList.add('hidden');
  }
  setActiveDashboardTab('orderListPanel');
}

function hideDashboard() {
  if (staffDashboard) {
    staffDashboard.classList.add('hidden');
  }
  if (staffLoginCard) {
    staffLoginCard.classList.remove('hidden');
  }
}

function updateNavigationForAuth() {
  const isAuthenticated = Boolean(state.token);
  if (panelNavButton) {
    panelNavButton.classList.toggle('hidden', !isAuthenticated);
  }
  if (loginNavButton) {
    loginNavButton.classList.toggle('hidden', isAuthenticated);
    if (isAuthenticated) {
      loginNavButton.classList.remove('active');
    }
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
    updateUserInfo();
    await loadStatuses();
    await loadTailors();
    await loadCustomers();
    await loadOrders();
    if (state.user?.role === 'administrador') {
      await loadAuditLogs();
    }
    showDashboard();
    updateNavigationForAuth();
    setActiveView('staff-view');
    state.customerSearchTerm = '';
    state.orderSearchTerm = '';
    if (customerSearchInput) {
      customerSearchInput.value = '';
    }
    if (orderSearchInput) {
      orderSearchInput.value = '';
    }
    setCreateCustomerVisible(false);
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
  if (orderDetailStatusSelect) {
    const selectedStatus =
      state.selectedOrderId !== null
        ? state.orders.find((order) => order.id === state.selectedOrderId)?.status
        : orderDetailStatusSelect.value;
    populateStatusSelect(orderDetailStatusSelect, selectedStatus);
  }
}

async function loadTailors() {
  if (!state.token) return;
  try {
    state.tailors = await apiFetch('/users/tailors');
  } catch (error) {
    showToast(error.message, 'error');
  }
  populateTailorSelect(assignTailorSelect);
  if (orderDetailTailorSelect) {
    const selectedValue =
      orderDetailTailorSelect.value ||
      (state.selectedOrderId !== null
        ? state.orders.find((order) => order.id === state.selectedOrderId)?.assigned_tailor?.id ?? ''
        : '');
    populateTailorSelect(orderDetailTailorSelect, selectedValue);
  }
}

async function loadOrders() {
  if (!state.token) return;
  try {
    state.orders = await apiFetch('/orders');
    if (state.selectedOrderId !== null) {
      const selected = state.orders.find((order) => order.id === state.selectedOrderId);
      if (selected) {
        populateOrderDetail(selected, { skipRender: true, focusOnDetail: false });
      } else {
        clearOrderDetail({ skipRender: true });
      }
    }
    renderOrders();
    renderCustomers();
    if (state.selectedCustomerId) {
      const activeCustomer = state.customers.find(
        (customer) => customer.id === state.selectedCustomerId,
      );
      if (activeCustomer) {
        renderCustomerOrderHistory(activeCustomer);
      }
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadCustomers() {
  if (!state.token) return;
  try {
    state.customers = await apiFetch('/customers');
    renderCustomers();
    populateCustomerSelect(orderCustomerSelect, state.selectedCustomerId);
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
  state.customerSearchTerm = '';
  state.orderSearchTerm = '';
  state.customerPage = 1;
  state.customerPageSize = DEFAULT_PAGE_SIZE;
  state.orderPage = 1;
  state.orderPageSize = DEFAULT_PAGE_SIZE;
  state.isCreateCustomerVisible = false;
  state.auditLogs = [];
  state.selectedCustomerId = null;
  state.selectedOrderId = null;
  if (assignTailorSelect) {
    populateTailorSelect(assignTailorSelect);
  }
  if (orderCustomerSelect) {
    populateCustomerSelect(orderCustomerSelect);
  }
  if (auditLogTabButton) {
    auditLogTabButton.classList.add('hidden');
  }
  setActiveDashboardTab('orderListPanel');
  hideDashboard();
  if (customerSearchInput) {
    customerSearchInput.value = '';
  }
  if (orderSearchInput) {
    orderSearchInput.value = '';
  }
  if (customerPageSizeSelect) {
    customerPageSizeSelect.value = String(DEFAULT_PAGE_SIZE);
  }
  if (orderPageSizeSelect) {
    orderPageSizeSelect.value = String(DEFAULT_PAGE_SIZE);
  }
  setCreateCustomerVisible(false);
  if (ordersTableBody) {
    ordersTableBody.innerHTML = '';
  }
  if (customersTableBody) {
    customersTableBody.innerHTML = '';
  }
  if (auditLogTableBody) {
    auditLogTableBody.innerHTML = '';
  }
  clearCustomerDetail();
  clearOrderDetail({ skipRender: true });
  resetCreateCustomerForm();

  measurementsList.innerHTML = '';
  ensureMeasurementRow();
  renderCustomerMeasurementOptions(null);
  clearOrderResult();
  updatePaginationControls({
    infoElement: customerPaginationInfo,
    prevButton: customerPrevPageButton,
    nextButton: customerNextPageButton,
    pageSizeSelect: customerPageSizeSelect,
    currentPage: 1,
    totalItems: 0,
    pageSize: state.customerPageSize,
    emptyLabel: 'clientes',
  });
  updatePaginationControls({
    infoElement: orderPaginationInfo,
    prevButton: orderPrevPageButton,
    nextButton: orderNextPageButton,
    pageSizeSelect: orderPageSizeSelect,
    currentPage: 1,
    totalItems: 0,
    pageSize: state.orderPageSize,
    emptyLabel: 'órdenes',
  });
  updateNavigationForAuth();
  setActiveView('staff-view');
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

function getOrdersForCustomer(customerId) {
  if (customerId === null || customerId === undefined) {
    return [];
  }
  const numericId = Number(customerId);
  if (!Number.isFinite(numericId)) {
    return [];
  }
  return state.orders.filter((order) => Number(order.customer_id) === numericId);
}

function sortOrdersByRecency(orders) {
  return [...orders].sort((a, b) => {
    const aTimestamp = toTimestamp(a?.updated_at) ?? toTimestamp(a?.created_at) ?? 0;
    const bTimestamp = toTimestamp(b?.updated_at) ?? toTimestamp(b?.created_at) ?? 0;
    if (aTimestamp !== bTimestamp) {
      return bTimestamp - aTimestamp;
    }
    const aId = typeof a?.id === 'number' ? a.id : Number(a?.id) || 0;
    const bId = typeof b?.id === 'number' ? b.id : Number(b?.id) || 0;
    return bId - aId;
  });
}

function renderCustomerOrderHistory(customer) {
  if (!customerOrderHistoryContainer) return;
  if (!customer) {
    customerOrderHistoryContainer.classList.add('muted');
    customerOrderHistoryContainer.textContent = CUSTOMER_ORDER_HISTORY_PROMPT;
    return;
  }

  const ordersForCustomer = sortOrdersByRecency(getOrdersForCustomer(customer.id));
  if (!ordersForCustomer.length) {
    customerOrderHistoryContainer.classList.add('muted');
    customerOrderHistoryContainer.textContent = CUSTOMER_ORDER_HISTORY_EMPTY_MESSAGE;
    return;
  }

  customerOrderHistoryContainer.classList.remove('muted');
  customerOrderHistoryContainer.innerHTML = '';

  const list = document.createElement('ul');
  list.className = 'customer-order-history-items';

  ordersForCustomer.forEach((order) => {
    const item = document.createElement('li');
    item.className = 'customer-order-history-item';

    const header = document.createElement('div');
    header.className = 'customer-order-history-item-header';

    const orderNumber = document.createElement('strong');
    orderNumber.textContent = order.order_number;

    const statusWrapper = document.createElement('div');
    statusWrapper.appendChild(createStatusBadge(order.status));

    header.appendChild(orderNumber);
    header.appendChild(statusWrapper);

    const invoice = document.createElement('p');
    invoice.className = 'customer-order-history-item-invoice';
    invoice.textContent = order.invoice_number
      ? `Factura: ${order.invoice_number}`
      : 'Factura: Sin número registrado';

    const meta = document.createElement('p');
    meta.className = 'customer-order-history-item-meta';
    const parts = [];
    if (order.origin_branch) {
      parts.push(`Establecimiento: ${order.origin_branch}`);
    }

    const deliveryLabel = formatDeliveryDateDisplay(order);
    if (deliveryLabel) {
      parts.push(`Entrega: ${deliveryLabel}`);
    }
    if (order.updated_at) {
      parts.push(`Actualizado: ${formatDate(order.updated_at)}`);
    }
    meta.textContent = parts.length ? parts.join(' • ') : 'Sin información adicional disponible.';

    item.appendChild(header);
    item.appendChild(invoice);

    item.appendChild(meta);
    list.appendChild(item);
  });

  customerOrderHistoryContainer.appendChild(list);
}
function renderCustomers() {
  if (!customersTableBody) return;
  const pageSize = getValidPageSize(state.customerPageSize);
  if (state.customerPageSize !== pageSize) {
    state.customerPageSize = pageSize;
  }
  customersTableBody.innerHTML = '';
  activeCustomerDetailRow = null;
  if (customerSearchInput && customerSearchInput.value !== state.customerSearchTerm) {
    customerSearchInput.value = state.customerSearchTerm;
  }
  if (!state.customers.length) {
    state.customerPage = 1;
    updatePaginationControls({
      infoElement: customerPaginationInfo,
      prevButton: customerPrevPageButton,
      nextButton: customerNextPageButton,
      pageSizeSelect: customerPageSizeSelect,
      currentPage: 1,
      totalItems: 0,
      pageSize,
      emptyLabel: 'clientes',
    });
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = CUSTOMER_TABLE_COLUMN_COUNT;

    cell.textContent = 'No hay clientes registrados aún.';
    cell.className = 'muted';
    row.appendChild(cell);
    customersTableBody.appendChild(row);
    clearCustomerDetail();
    return;
  }

  const searchTerm = normalizeText(state.customerSearchTerm);
  const filteredCustomers = searchTerm
    ? state.customers.filter((customer) => {
        const name = normalizeText(customer.full_name);
        const documentId = normalizeText(customer.document_id);
        return name.includes(searchTerm) || documentId.includes(searchTerm);
      })
    : state.customers;

  if (
    state.selectedCustomerId &&
    filteredCustomers.every((customer) => customer.id !== state.selectedCustomerId)
  ) {
    clearCustomerDetail();
  }

  if (!filteredCustomers.length) {
    state.customerPage = 1;
    updatePaginationControls({
      infoElement: customerPaginationInfo,
      prevButton: customerPrevPageButton,
      nextButton: customerNextPageButton,
      pageSizeSelect: customerPageSizeSelect,
      currentPage: 1,
      totalItems: 0,
      pageSize,
      emptyLabel: 'clientes',
    });
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = CUSTOMER_TABLE_COLUMN_COUNT;

    cell.textContent = 'No se encontraron clientes que coincidan con la búsqueda.';
    cell.className = 'muted';
    row.appendChild(cell);
    customersTableBody.appendChild(row);
    return;
  }

  const totalItems = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  let currentPage = Number(state.customerPage) || 1;

  if (state.selectedCustomerId !== null) {
    const selectedIndex = filteredCustomers.findIndex(
      (customer) => customer.id === state.selectedCustomerId,
    );
    if (selectedIndex >= 0) {
      const selectedPage = Math.floor(selectedIndex / pageSize) + 1;
      if (selectedPage !== currentPage) {
        currentPage = selectedPage;
      }
    }
  }

  currentPage = Math.min(Math.max(currentPage, 1), totalPages);
  currentPage =
    updatePaginationControls({
      infoElement: customerPaginationInfo,
      prevButton: customerPrevPageButton,
      nextButton: customerNextPageButton,
      pageSizeSelect: customerPageSizeSelect,
      currentPage,
      totalItems,
      pageSize,
      emptyLabel: 'clientes',
    }) || currentPage;

  if (!Number.isFinite(currentPage) || currentPage < 1) {
    currentPage = 1;
  }

  if (state.customerPage !== currentPage) {
    state.customerPage = currentPage;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  let detailRendered = false;


  paginatedCustomers.forEach((customer) => {
    const row = document.createElement('tr');
    row.classList.add('customer-row');
    row.dataset.customerId = String(customer.id);

    const isSelected = state.selectedCustomerId === customer.id;
    if (isSelected) {
      row.classList.add('is-selected');
    }

    const ordersForCustomer = getOrdersForCustomer(customer.id);
    const orderCount = ordersForCustomer.length;


    const nameCell = document.createElement('td');
    nameCell.textContent = customer.full_name;

    const documentCell = document.createElement('td');
    documentCell.textContent = customer.document_id;

    const phoneCell = document.createElement('td');
    phoneCell.textContent = customer.phone || '—';

    const orderCountCell = document.createElement('td');
    orderCountCell.className = 'customer-order-count-cell';
    if (orderCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'customer-order-count-badge';
      badge.textContent = orderCount;
      const label =
        orderCount === 1 ? '1 orden registrada' : `${orderCount} órdenes registradas`;
      badge.title = label;
      badge.setAttribute('aria-label', label);
      orderCountCell.appendChild(badge);
    } else {
      orderCountCell.innerHTML = '<span class="muted">0</span>';
    }

    const actionsCell = document.createElement('td');
    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.className = 'secondary';
    viewButton.dataset.action = 'toggle-customer-detail';
    viewButton.dataset.customerId = String(customer.id);
    viewButton.setAttribute('aria-controls', 'customerDetail');
    viewButton.textContent = isSelected ? 'Ocultar detalle' : 'Ver detalle';
    viewButton.setAttribute('aria-expanded', isSelected ? 'true' : 'false');
    viewButton.addEventListener('click', () => {
      if (state.selectedCustomerId === customer.id) {
        clearCustomerDetail({ reRender: true });
      } else {
        populateCustomerDetail(customer);
      }
    });
    actionsCell.appendChild(viewButton);

    row.appendChild(nameCell);
    row.appendChild(documentCell);
    row.appendChild(phoneCell);
    row.appendChild(orderCountCell);
    row.appendChild(actionsCell);

    customersTableBody.appendChild(row);

    if (isSelected && customerDetail) {
      const detailRow = document.createElement('tr');
      detailRow.className = 'customer-detail-row';
      detailRow.dataset.customerId = String(customer.id);

      const detailCell = document.createElement('td');
      detailCell.colSpan = CUSTOMER_TABLE_COLUMN_COUNT;
      detailCell.className = 'customer-detail-cell';
      detailCell.appendChild(customerDetail);

      detailRow.appendChild(detailCell);
      customersTableBody.appendChild(detailRow);
      activeCustomerDetailRow = detailRow;
      customerDetail.classList.remove('hidden');
      viewButton.textContent = 'Ocultar detalle';
      viewButton.setAttribute('aria-expanded', 'true');
      detailRendered = true;
    }
  });

  if (!detailRendered && customerDetail) {
    customerDetail.classList.add('hidden');
    activeCustomerDetailRow = null;
  }
}

function populateCustomerDetail(customer) {
  if (!customerDetail) return;
  state.selectedCustomerId = customer.id;
  customerDetail.classList.remove('hidden');

  if (customerDetailTitle) {
    customerDetailTitle.textContent = customer.full_name || CUSTOMER_DETAIL_DEFAULT_TITLE;
  }

  const ordersForCustomer = getOrdersForCustomer(customer.id);

  if (customerDetailSummaryElement) {
    const summaryParts = [];
    if (customer.document_id) {
      summaryParts.push(`Documento: ${customer.document_id}`);
    }
    if (customer.phone) {
      summaryParts.push(`Teléfono: ${customer.phone}`);
    }
    if (ordersForCustomer.length) {
      const label =
        ordersForCustomer.length === 1
          ? '1 orden registrada'
          : `${ordersForCustomer.length} órdenes registradas`;
      summaryParts.push(label);
    }
    customerDetailSummaryElement.textContent =
      summaryParts.length ? summaryParts.join(' • ') : 'Sin datos de contacto registrados.';
  }

  const nameInput = document.getElementById('updateCustomerName');
  const documentInput = document.getElementById('updateCustomerDocument');
  const phoneInput = document.getElementById('updateCustomerPhone');
  if (nameInput) nameInput.value = customer.full_name;
  if (documentInput) documentInput.value = customer.document_id;
  if (phoneInput) phoneInput.value = customer.phone || '';

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

  renderCustomerOrderHistory(customer);
  renderCustomers();
  requestAnimationFrame(() => {
    const detailRow = customersTableBody?.querySelector(
      `.customer-detail-row[data-customer-id="${customer.id}"]`,
    );
    detailRow?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

}

function clearCustomerDetail(options = {}) {
  if (!customerDetail) return;
  const { reRender = false } = options;
  customerDetail.classList.add('hidden');
  state.selectedCustomerId = null;

  if (customerDetailTitle) {
    customerDetailTitle.textContent = CUSTOMER_DETAIL_DEFAULT_TITLE;
  }
  if (customerDetailSummaryElement) {
    customerDetailSummaryElement.textContent = CUSTOMER_DETAIL_DEFAULT_SUMMARY;
  }
  renderCustomerOrderHistory(null);

  updateCustomerForm?.reset();
  if (updateCustomerMeasurementsContainer) {
    updateCustomerMeasurementsContainer.innerHTML = '';
  }


  if (!reRender && customersTableBody) {
    customersTableBody.querySelectorAll('.customer-row').forEach((row) => {
      row.classList.remove('is-selected');
      const toggleButton = row.querySelector('button[data-action="toggle-customer-detail"]');
      if (toggleButton) {
        toggleButton.textContent = 'Ver detalle';
        toggleButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (reRender) {
    renderCustomers();
  }
}

if (closeCustomerDetailButton) {
  closeCustomerDetailButton.addEventListener('click', () => {
    clearCustomerDetail({ reRender: true });
  });
}

function populateOrderDetail(order, options = {}) {
  if (!orderDetail || !order) return;
  const { skipRender = false, focusOnDetail = true } = options;

  state.selectedOrderId = order.id;
  if (orderDetailNumberElement) {
    orderDetailNumberElement.textContent = order.order_number;
  }
  if (orderDetailCreatedAtElement) {
    orderDetailCreatedAtElement.textContent = formatDate(order.created_at);
  }
  if (orderDetailUpdatedAtElement) {
    orderDetailUpdatedAtElement.textContent = formatDate(order.updated_at);
  }
  if (orderDetailCustomerInput) {
    orderDetailCustomerInput.value = order.customer_name || '';
  }
  if (orderDetailDocumentInput) {
    orderDetailDocumentInput.value = order.customer_document || '';
  }
  if (orderDetailContactInput) {
    orderDetailContactInput.value = order.customer_contact || '';
  }
  if (orderDetailStatusSelect) {
    populateStatusSelect(orderDetailStatusSelect, order.status);
  }
  if (orderDetailTailorSelect) {
    populateTailorSelect(orderDetailTailorSelect, order.assigned_tailor?.id ?? '');
  }
  if (orderDetailInvoiceInput) {
    orderDetailInvoiceInput.value = order.invoice_number || '';
  }
  if (orderDetailOriginSelect) {
    populateEstablishmentSelect(orderDetailOriginSelect, order.origin_branch || '');
  }
  if (orderDetailDeliveryDateInput) {
    orderDetailDeliveryDateInput.value = toInputDateTimeValue(order.delivery_date);
  }
  if (orderDetailNotesTextarea) {
    orderDetailNotesTextarea.value = order.notes || '';
  }
  if (orderDetailMeasurementsContainer) {
    orderDetailMeasurementsContainer.innerHTML = '';
    if (order.measurements?.length) {
      orderDetailMeasurementsContainer.classList.remove('muted');
      order.measurements.forEach((item) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = `${item.nombre}: ${item.valor}`;
        orderDetailMeasurementsContainer.appendChild(tag);
      });
    } else {
      orderDetailMeasurementsContainer.classList.add('muted');
      orderDetailMeasurementsContainer.textContent = 'Sin medidas registradas.';
    }
  }

  if (!skipRender) {
    renderOrders();
    if (focusOnDetail) {
      requestAnimationFrame(() => {
        if (orderDetail?.isConnected) {
          orderDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
  }
}

function clearOrderDetail(options = {}) {
  if (!orderDetail) return;
  const { skipRender = false } = options;

  state.selectedOrderId = null;
  updateOrderForm?.reset();
  if (orderDetailNumberElement) orderDetailNumberElement.textContent = '';
  if (orderDetailCreatedAtElement) orderDetailCreatedAtElement.textContent = '';
  if (orderDetailUpdatedAtElement) orderDetailUpdatedAtElement.textContent = '';
  if (orderDetailCustomerInput) orderDetailCustomerInput.value = '';
  if (orderDetailDocumentInput) orderDetailDocumentInput.value = '';
  if (orderDetailContactInput) orderDetailContactInput.value = '';
  if (orderDetailStatusSelect) populateStatusSelect(orderDetailStatusSelect);
  if (orderDetailTailorSelect) populateTailorSelect(orderDetailTailorSelect);
  if (orderDetailInvoiceInput) orderDetailInvoiceInput.value = '';
  if (orderDetailOriginSelect) populateEstablishmentSelect(orderDetailOriginSelect);
  if (orderDetailDeliveryDateInput) orderDetailDeliveryDateInput.value = '';
  if (orderDetailNotesTextarea) orderDetailNotesTextarea.value = '';
  if (orderDetailMeasurementsContainer) {
    orderDetailMeasurementsContainer.innerHTML = '';
    orderDetailMeasurementsContainer.classList.add('muted');
  }

  removeOrderDetailRow();
  orderDetail.classList.add('hidden');

  if (!skipRender) {
    renderOrders();
  }
}

async function handleOrderUpdate(event) {
  event.preventDefault();
  if (state.selectedOrderId === null) {
    showToast('Selecciona una orden para actualizar.', 'error');
    return;
  }
  const submitButton = updateOrderForm?.querySelector('button[type="submit"]');
  const originBranchValue = orderDetailOriginSelect?.value || '';
  const invoiceValueRaw = orderDetailInvoiceInput?.value.trim() || '';
  if (!originBranchValue) {
    showToast('Selecciona el establecimiento remitente.', 'error');
    return;
  }
  if (submitButton) {
    submitButton.disabled = true;
  }
  const deliveryDateValue = orderDetailDeliveryDateInput?.value || '';
  const invoiceValue = invoiceValueRaw || null;
  try {
    await apiFetch(`/orders/${state.selectedOrderId}`, {
      method: 'PATCH',
      body: {
        status: orderDetailStatusSelect?.value,
        assigned_tailor_id: orderDetailTailorSelect?.value
          ? Number(orderDetailTailorSelect.value)
          : null,
        customer_contact: orderDetailContactInput?.value.trim() || null,
        notes: orderDetailNotesTextarea?.value.trim() || null,
        delivery_date: deliveryDateValue ? deliveryDateValue : null,
        invoice_number: invoiceValue,
        origin_branch: originBranchValue,
      },
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

if (customerSearchInput) {
  customerSearchInput.addEventListener('input', (event) => {
    state.customerSearchTerm = event.target.value;
    state.customerPage = 1;
    renderCustomers();
  });
}

if (orderSearchInput) {
  orderSearchInput.addEventListener('input', (event) => {
    state.orderSearchTerm = event.target.value;
    state.orderPage = 1;
    renderOrders();
  });
}

if (customerPageSizeSelect) {
  customerPageSizeSelect.addEventListener('change', (event) => {
    const newSize = getValidPageSize(event.target.value);
    state.customerPageSize = newSize;
    state.customerPage = 1;
    renderCustomers();
  });
}

if (customerPrevPageButton) {
  customerPrevPageButton.addEventListener('click', () => {
    if (state.customerPage > 1) {
      state.customerPage -= 1;
      renderCustomers();
    }
  });
}

if (customerNextPageButton) {
  customerNextPageButton.addEventListener('click', () => {
    state.customerPage += 1;
    renderCustomers();
  });
}

if (orderPageSizeSelect) {
  orderPageSizeSelect.addEventListener('change', (event) => {
    const newSize = getValidPageSize(event.target.value);
    state.orderPageSize = newSize;
    state.orderPage = 1;
    renderOrders();
  });
}

if (orderPrevPageButton) {
  orderPrevPageButton.addEventListener('click', () => {
    if (state.orderPage > 1) {
      state.orderPage -= 1;
      renderOrders();
    }
  });
}

if (orderNextPageButton) {
  orderNextPageButton.addEventListener('click', () => {
    state.orderPage += 1;
    renderOrders();
  });
}

if (showCreateCustomerButton) {
  showCreateCustomerButton.addEventListener('click', () => {
    setCreateCustomerVisible(true);
  });
}

if (closeCreateCustomerButton) {
  closeCreateCustomerButton.addEventListener('click', () => {
    setCreateCustomerVisible(false);
  });
}


if (updateOrderForm) {
  updateOrderForm.addEventListener('submit', handleOrderUpdate);
}

if (closeOrderDetailButton) {
  closeOrderDetailButton.addEventListener('click', () => {
    clearOrderDetail();
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
      await loadCustomers();
      setCreateCustomerVisible(false);
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
      await loadCustomers();
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
      await loadCustomers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}
async function createOrder(event) {
  event.preventDefault();
  const newOrderNumber = document.getElementById('newOrderNumber').value.trim();
  const selectedCustomerId = Number(orderCustomerSelect.value);
  const newCustomerName = document.getElementById('newCustomerName').value.trim();
  const newCustomerDocument = document.getElementById('newCustomerDocument').value.trim();
  const newCustomerContact = document.getElementById('newCustomerContact').value.trim();
  const newOrderStatus = document.getElementById('newOrderStatus').value;
  const newOrderDeliveryDate = newOrderDeliveryDateInput?.value || '';
  const newOrderNotes = document.getElementById('newOrderNotes').value.trim();
  const assignedTailorId = assignTailorSelect.value ? Number(assignTailorSelect.value) : null;
  const invoiceNumber = newOrderInvoiceInput?.value.trim() || '';
  const originBranch = newOrderOriginSelect?.value || '';
  const measurements = collectMeasurements();

  if (!selectedCustomerId) {
    showToast('Selecciona un cliente para registrar la orden.', 'error');
    return;
  }

  if (!originBranch) {
    showToast('Selecciona el establecimiento remitente.', 'error');
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
        delivery_date: newOrderDeliveryDate ? newOrderDeliveryDate : null,
        invoice_number: invoiceNumber || null,
        origin_branch: originBranch,
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

function handleOrderCustomerChange() {
  const selectedId = Number(orderCustomerSelect.value);
  const customer = state.customers.find((item) => item.id === selectedId);
  const documentInput = document.getElementById('newCustomerDocument');
  const nameInput = document.getElementById('newCustomerName');
  const contactInput = document.getElementById('newCustomerContact');
  if (!customer) {
    if (documentInput) documentInput.value = '';
    if (nameInput) nameInput.value = '';
    if (contactInput) contactInput.value = '';
    renderCustomerMeasurementOptions(null);
    return;
  }
  if (documentInput) documentInput.value = customer.document_id || '';
  if (nameInput) nameInput.value = customer.full_name || '';
  if (contactInput) contactInput.value = customer.phone || '';
  renderCustomerMeasurementOptions(customer);
}

if (orderCustomerSelect) {
  orderCustomerSelect.addEventListener('change', handleOrderCustomerChange);
}

populateEstablishmentSelect(newOrderOriginSelect);
populateEstablishmentSelect(orderDetailOriginSelect);

function parseDateValue(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function toTimestamp(value) {
  const parsed = parseDateValue(value);
  return parsed ? parsed.getTime() : null;
}

function compareOrdersForDisplay(a, b) {
  const aDelivered = isOrderDelivered(a.status);
  const bDelivered = isOrderDelivered(b.status);
  if (aDelivered !== bDelivered) {
    return aDelivered ? 1 : -1;
  }

  const aDelivery = toTimestamp(a.delivery_date);
  const bDelivery = toTimestamp(b.delivery_date);

  if (aDelivered && bDelivered) {
    if (aDelivery !== bDelivery) {
      if (aDelivery === null) return 1;
      if (bDelivery === null) return -1;
      return bDelivery - aDelivery;
    }
  } else if (aDelivery !== bDelivery) {
    if (aDelivery === null) return 1;
    if (bDelivery === null) return -1;
    return aDelivery - bDelivery;
  }

  if (!aDelivered) {
    const aCreated = toTimestamp(a.created_at);
    const bCreated = toTimestamp(b.created_at);
    if (aCreated !== bCreated) {
      if (aCreated === null) return 1;
      if (bCreated === null) return -1;
      return aCreated - bCreated;
    }
  } else {
    const aUpdated = toTimestamp(a.updated_at);
    const bUpdated = toTimestamp(b.updated_at);
    if (aUpdated !== bUpdated) {
      if (aUpdated === null) return 1;
      if (bUpdated === null) return -1;
      return bUpdated - aUpdated;
    }
  }

  const aOrder = (a.order_number || '').toString().toLowerCase();
  const bOrder = (b.order_number || '').toString().toLowerCase();
  const orderComparison = aOrder.localeCompare(bOrder, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  if (orderComparison !== 0) {
    return orderComparison;
  }

  const aId = typeof a.id === 'number' ? a.id : Number(a.id) || 0;
  const bId = typeof b.id === 'number' ? b.id : Number(b.id) || 0;
  return aId - bId;
}

function removeOrderDetailRow() {
  if (activeOrderDetailRow && activeOrderDetailRow.parentNode) {
    activeOrderDetailRow.parentNode.removeChild(activeOrderDetailRow);
  }
  activeOrderDetailRow = null;
}

function removeCustomerDetailRow() {
  if (activeCustomerDetailRow && activeCustomerDetailRow.parentNode) {
    activeCustomerDetailRow.parentNode.removeChild(activeCustomerDetailRow);
  }
  activeCustomerDetailRow = null;
}

function getStatusBadgeVariant(status) {
  if (!status) {
    return 'neutral';
  }
  const normalized = status.toString().trim().toLowerCase();
  if (!normalized) {
    return 'neutral';
  }
  if (normalized.includes('entreg')) {
    return 'success';
  }
  if (normalized.includes('cancel') || normalized.includes('anulad')) {
    return 'danger';
  }
  if (normalized.includes('pend') || normalized.includes('espera')) {
    return 'warning';
  }
  if (
    normalized.includes('listo') ||
    normalized.includes('termin') ||
    normalized.includes('produc') ||
    normalized.includes('proceso')
  ) {
    return 'info';
  }
  return 'neutral';
}

function createStatusBadge(status) {
  const badge = document.createElement('span');
  badge.className = 'status-badge';
  const text = status && status.toString().trim() ? status : 'Sin estado';
  badge.textContent = text;
  badge.classList.add(`status-${getStatusBadgeVariant(status)}`);
  return badge;
}


function getValidPageSize(value) {
  const numericValue = Number(value);
  if (PAGE_SIZE_OPTIONS.includes(numericValue)) {
    return numericValue;
  }
  return DEFAULT_PAGE_SIZE;
}

function updatePaginationControls({
  infoElement,
  prevButton,
  nextButton,
  pageSizeSelect,
  currentPage,
  totalItems,
  pageSize,
  emptyLabel,
}) {
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
  const normalizedPage = totalItems > 0 ? Math.min(Math.max(currentPage, 1), totalPages) : 1;
  const startItem = totalItems === 0 ? 0 : (normalizedPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(normalizedPage * pageSize, totalItems);

  if (infoElement) {
    infoElement.textContent =
      totalItems === 0
        ? `Sin ${emptyLabel}`
        : `Mostrando ${startItem}-${endItem} de ${totalItems}`;
  }

  if (prevButton) {
    const isDisabled = totalItems === 0 || normalizedPage <= 1;
    prevButton.disabled = isDisabled;
    prevButton.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
  }

  if (nextButton) {
    const isDisabled = totalItems === 0 || normalizedPage >= totalPages;
    nextButton.disabled = isDisabled;
    nextButton.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
  }

  if (pageSizeSelect && pageSizeSelect.value !== String(pageSize)) {
    pageSizeSelect.value = String(pageSize);
  }

  return normalizedPage;
}


function renderOrders() {
  if (!ordersTableBody) return;

  const pageSize = getValidPageSize(state.orderPageSize);
  if (state.orderPageSize !== pageSize) {
    state.orderPageSize = pageSize;
  }

  removeOrderDetailRow();
  if (orderDetail) {
    orderDetail.classList.add('hidden');
  }

  ordersTableBody.innerHTML = '';
  if (orderSearchInput && orderSearchInput.value !== state.orderSearchTerm) {
    orderSearchInput.value = state.orderSearchTerm;
  }

  if (!state.orders.length) {
    state.orderPage = 1;
    updatePaginationControls({
      infoElement: orderPaginationInfo,
      prevButton: orderPrevPageButton,
      nextButton: orderNextPageButton,
      pageSizeSelect: orderPageSizeSelect,
      currentPage: 1,
      totalItems: 0,
      pageSize,
      emptyLabel: 'órdenes',
    });
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = ORDER_TABLE_COLUMN_COUNT;
    cell.textContent = 'No hay órdenes registradas todavía.';
    cell.className = 'muted';
    row.appendChild(cell);
    ordersTableBody.appendChild(row);
    clearOrderDetail({ skipRender: true });
    return;
  }

  const searchTerm = normalizeText(state.orderSearchTerm);
  const filteredOrders = searchTerm
    ? state.orders.filter((order) => {
        const orderNumber = normalizeText(order.order_number);
        const documentId = normalizeText(order.customer_document);
        return orderNumber.includes(searchTerm) || documentId.includes(searchTerm);
      })
    : [...state.orders];

  if (!filteredOrders.length) {
    state.orderPage = 1;
    updatePaginationControls({
      infoElement: orderPaginationInfo,
      prevButton: orderPrevPageButton,
      nextButton: orderNextPageButton,
      pageSizeSelect: orderPageSizeSelect,
      currentPage: 1,
      totalItems: 0,
      pageSize,
      emptyLabel: 'órdenes',
    });
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = ORDER_TABLE_COLUMN_COUNT;
    cell.textContent = 'No se encontraron órdenes que coincidan con la búsqueda.';
    cell.className = 'muted';
    row.appendChild(cell);
    ordersTableBody.appendChild(row);
    clearOrderDetail({ skipRender: true });
    return;
  }

  const sortedOrders = [...filteredOrders].sort(compareOrdersForDisplay);

  if (
    state.selectedOrderId !== null &&
    sortedOrders.every((order) => order.id !== state.selectedOrderId)
  ) {
    clearOrderDetail({ skipRender: true });
  }

  const totalItems = sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  let currentPage = Number(state.orderPage) || 1;

  if (state.selectedOrderId !== null) {
    const selectedIndex = sortedOrders.findIndex((order) => order.id === state.selectedOrderId);
    if (selectedIndex >= 0) {
      const selectedPage = Math.floor(selectedIndex / pageSize) + 1;
      if (selectedPage !== currentPage) {
        currentPage = selectedPage;
      }
    }
  }

  currentPage = Math.min(Math.max(currentPage, 1), totalPages);
  currentPage =
    updatePaginationControls({
      infoElement: orderPaginationInfo,
      prevButton: orderPrevPageButton,
      nextButton: orderNextPageButton,
      pageSizeSelect: orderPageSizeSelect,
      currentPage,
      totalItems,
      pageSize,
      emptyLabel: 'órdenes',
    }) || currentPage;

  if (!Number.isFinite(currentPage) || currentPage < 1) {
    currentPage = 1;
  }

  if (state.orderPage !== currentPage) {
    state.orderPage = currentPage;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + pageSize);

  let hasActiveDetail = false;

  paginatedOrders.forEach((order) => {
    const row = document.createElement('tr');
    row.classList.add('order-row');
    const isSelected = state.selectedOrderId === order.id;
    if (isSelected) {
      row.classList.add('is-selected');
    }

    const orderCell = document.createElement('td');
    orderCell.innerHTML = `<strong>${order.order_number}</strong>`;

    const customerCell = document.createElement('td');
    customerCell.textContent = order.customer_name || '—';

    const statusCell = document.createElement('td');
    statusCell.appendChild(createStatusBadge(order.status));

    const createdCell = document.createElement('td');
    createdCell.textContent = formatDate(order.created_at);

    const deliveryCell = document.createElement('td');
    if (order.delivery_date) {
      const deliveryLabel = formatDeliveryDateDisplay(order) || formatDateOnly(order.delivery_date);
      deliveryCell.textContent = deliveryLabel;
      if (isDeliveryDateOverdue(order.delivery_date, order.status)) {
        deliveryCell.classList.add('overdue');
      } else if (isDeliveryDateClose(order.delivery_date, order.status)) {
        deliveryCell.classList.add('due-soon');
      }
    } else {
      deliveryCell.innerHTML = '<span class="muted">Sin definir</span>';
    }

    const actionsCell = document.createElement('td');
    const detailButton = document.createElement('button');
    detailButton.type = 'button';
    detailButton.className = 'secondary';
    detailButton.textContent = isSelected ? 'Ocultar detalle' : 'Ver detalle';
    detailButton.setAttribute('aria-controls', 'orderDetail');
    detailButton.setAttribute('aria-expanded', isSelected ? 'true' : 'false');
    detailButton.addEventListener('click', () => {
      if (state.selectedOrderId === order.id) {
        clearOrderDetail();
      } else {
        populateOrderDetail(order);
      }
    });
    actionsCell.appendChild(detailButton);

    row.appendChild(orderCell);
    row.appendChild(customerCell);
    row.appendChild(statusCell);
    row.appendChild(createdCell);
    row.appendChild(deliveryCell);
    row.appendChild(actionsCell);

    ordersTableBody.appendChild(row);

    if (isSelected && orderDetail) {
      const detailRow = document.createElement('tr');
      detailRow.className = 'order-detail-row';
      detailRow.dataset.orderId = String(order.id);

      const detailCell = document.createElement('td');
      detailCell.colSpan = ORDER_TABLE_COLUMN_COUNT;
      detailCell.className = 'order-detail-cell';
      detailCell.appendChild(orderDetail);

      detailRow.appendChild(detailCell);
      ordersTableBody.appendChild(detailRow);
      activeOrderDetailRow = detailRow;
      orderDetail.classList.remove('hidden');
      detailButton.textContent = 'Ocultar detalle';
      detailButton.setAttribute('aria-expanded', 'true');
      hasActiveDetail = true;
    }
  });

  if (!hasActiveDetail && orderDetail) {
    orderDetail.classList.add('hidden');
  }
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
}

initialise();
updateNavigationForAuth();
