const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000';
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
const ESTABLISHMENTS = ['Urdesa', 'Batan', 'Indie'];
const ORDER_TASK_STATUS_PENDING = 'pendiente';
const ORDER_TASK_STATUS_COMPLETED = 'completado';
const KANBAN_FETCH_PAGE_SIZE = 100;
const KANBAN_FALLBACK_STATUS = 'Sin estado';


const state = {
  statuses: [],
  token: null,
  user: null,
  tailors: [],
  vendors: [],
  orders: [],
  customers: [],
  customerOptions: [],
  customerOrdersCache: {},
  customerDisplayCache: {},
  customerSearchTerm: '',
  orderSearchTerm: '',
  customerPage: 1,
  customerPageSize: DEFAULT_PAGE_SIZE,
  orderPage: 1,
  orderPageSize: DEFAULT_PAGE_SIZE,
  customerTotal: 0,
  orderTotal: 0,
  kanbanOrders: [],
  kanbanLoading: false,
  kanbanError: null,
  kanbanSearchTerm: '',
  kanbanNeedsRefresh: true,
  kanbanLastUpdated: null,
  isCreateCustomerVisible: false,
  isCreateUserVisible: false,
  auditLogs: [],
  users: [],
  usersLoaded: false,
  usersLoadError: null,
  editingUserId: null,
  selectedCustomerId: null,
  selectedOrderId: null,
  orderTasks: [],
  orderTasksOrderId: null,
  orderTasksLoading: false,
  orderTasksRequestId: 0,
  customerRequestId: 0,
  orderRequestId: 0,
  customerOptionsRequestId: 0,
};

const TOKEN_STORAGE_KEY = 'sastreria.authToken';

function getTokenStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage || null;
  } catch (error) {
    return null;
  }
}

function persistToken(token) {
  const storage = getTokenStorage();
  if (!storage) return;
  try {
    if (token) {
      storage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      storage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    /* ignore storage errors */
  }
}

function readStoredToken() {
  const storage = getTokenStorage();
  if (!storage) return null;
  try {
    const storedToken = storage.getItem(TOKEN_STORAGE_KEY);
    if (typeof storedToken !== 'string') {
      return null;
    }
    const trimmedToken = storedToken.trim();
    return trimmedToken ? trimmedToken : null;
  } catch (error) {
    return null;
  }
}

function clearStoredToken() {
  persistToken(null);
}

const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('.nav-link');
const panelNavButton = document.getElementById('panelNavButton');
const loginNavButton = document.getElementById('loginNavButton');
const dashboardTabButtons = document.querySelectorAll('.dashboard-tab');
const dashboardPanels = document.querySelectorAll('.dashboard-panel');
const orderCreateTabButton = document.getElementById('orderCreateTabButton');
const orderCreatePanel = document.getElementById('orderCreatePanel');
const orderKanbanPanel = document.getElementById('orderKanbanPanel');
const orderKanbanColumns = document.getElementById('orderKanbanColumns');
const orderKanbanStatus = document.getElementById('orderKanbanStatus');
const orderKanbanSearchInput = document.getElementById('orderKanbanSearchInput');
const orderKanbanRefreshButton = document.getElementById('orderKanbanRefreshButton');
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
const updateCustomerNameInput = document.getElementById('updateCustomerName');
const updateCustomerDocumentInput = document.getElementById('updateCustomerDocument');
const updateCustomerPhoneInput = document.getElementById('updateCustomerPhone');
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
const newOrderTasksList = document.getElementById('newOrderTasksList');
const addOrderTaskButton = document.getElementById('addOrderTaskButton');
const statusSelect = document.getElementById('newOrderStatus');
const assignTailorSelect = document.getElementById('assignTailor');
const assignVendorSelect = document.getElementById('assignVendor');
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
const orderDetailVendorSelect = document.getElementById('orderDetailVendor');
const orderDetailInvoiceInput = document.getElementById('orderDetailInvoice');
const orderDetailOriginSelect = document.getElementById('orderDetailOrigin');
const orderDetailDeliveryDateInput = document.getElementById('orderDetailDeliveryDate');
const orderDetailNotesTextarea = document.getElementById('orderDetailNotes');
const orderDetailMeasurementsContainer = document.getElementById('orderDetailMeasurements');
const orderTasksList = document.getElementById('orderTasksList');
const orderTaskForm = document.getElementById('orderTaskForm');
const orderTaskDescriptionInput = document.getElementById('orderTaskDescription');
const orderTaskResponsibleSelect = document.getElementById('orderTaskResponsibleSelect');
const orderTasksPermissionsNotice = document.getElementById('orderTasksPermissionsNotice');
const closeOrderDetailButton = document.getElementById('closeOrderDetailButton');
const toastElement = document.getElementById('toast');
const currentYearElement = document.getElementById('currentYear');
const currentUserNameElement = document.getElementById('currentUserName');
const currentUserRoleElement = document.getElementById('currentUserRole');
const usersTabButton = document.getElementById('usersTabButton');
const auditLogTabButton = document.getElementById('auditLogTabButton');
const auditLogTableBody = document.getElementById('auditLogTableBody');
const usersTableBody = document.getElementById('usersTableBody');
const userCreateContainer = document.getElementById('userCreateContainer');
const toggleCreateUserButton = document.getElementById('toggleCreateUserButton');
const closeCreateUserButton = document.getElementById('closeCreateUserButton');
const createUserForm = document.getElementById('createUserForm');
const newUserUsernameInput = document.getElementById('newUserUsername');
const newUserFullNameInput = document.getElementById('newUserFullName');
const newUserPasswordInput = document.getElementById('newUserPassword');
const newUserRoleSelect = document.getElementById('newUserRole');
const userEditContainer = document.getElementById('userEditContainer');
const editUserForm = document.getElementById('editUserForm');
const editUserUsernameInput = document.getElementById('editUserUsername');
const editUserFullNameInput = document.getElementById('editUserFullName');
const editUserRoleSelect = document.getElementById('editUserRole');
const editUserPasswordInput = document.getElementById('editUserPassword');
const cancelEditUserButton = document.getElementById('cancelEditUserButton');
const editUserTitle = document.getElementById('editUserTitle');
const closeCustomerDetailButton = document.getElementById('closeCustomerDetailButton');

const ROLE_LABELS = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  sastre: 'Sastre',
};

const DEFAULT_NEW_USER_ROLE = 'vendedor';

const USER_ROLE_OPTIONS = [
  { value: 'administrador', label: ROLE_LABELS.administrador },
  { value: 'vendedor', label: ROLE_LABELS.vendedor },
  { value: 'sastre', label: ROLE_LABELS.sastre },
];

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

function isOrderCreatePanelHidden() {
  return !orderCreatePanel || orderCreatePanel.classList.contains('hidden');
}

function syncCreateOrderFormDisabled() {
  if (!createOrderForm) return;
  const shouldDisable = isOrderCreatePanelHidden();
  createOrderForm.dataset.disabled = shouldDisable ? 'true' : 'false';
  const submitButton = createOrderForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = shouldDisable;
  }
}

function setActiveDashboardTab(tabId = 'orderListPanel') {
  if (!dashboardPanels.length) return;
  const userRole = state.user?.role || null;
  let targetTab = tabId || 'orderListPanel';
  if (targetTab === 'auditLogPanel' && userRole !== 'administrador') {
    targetTab = 'orderListPanel';
  }
  if (targetTab === 'orderCreatePanel' && userRole === 'sastre') {
    targetTab = 'orderListPanel';
  }
  if (targetTab === 'usersPanel' && userRole !== 'administrador') {
    targetTab = 'orderListPanel';
  }
  activeDashboardTab = targetTab;
  dashboardTabButtons.forEach((btn) => {
    const tab = btn.dataset.tab;
    if (tab === 'orderCreatePanel') {
      const shouldHideTab = userRole === 'sastre';
      if (shouldHideTab) {
        btn.classList.add('hidden');
      } else {
        btn.classList.remove('hidden');
      }
      btn.disabled = shouldHideTab;
    }
    if (tab === 'usersPanel') {
      const shouldHideUsersTab = userRole !== 'administrador';
      if (shouldHideUsersTab) {
        btn.classList.add('hidden');
      } else {
        btn.classList.remove('hidden');
      }
      btn.disabled = shouldHideUsersTab;
    }
    btn.classList.toggle('active', tab === targetTab);
  });
  dashboardPanels.forEach((panel) => {
    if (panel.id === 'orderCreatePanel' && userRole === 'sastre') {
      panel.classList.add('hidden');
    } else if (panel.id === 'usersPanel' && userRole !== 'administrador') {
      panel.classList.add('hidden');
    } else {
      panel.classList.toggle('hidden', panel.id !== targetTab);
    }
  });
  if (targetTab === 'usersPanel' && userRole === 'administrador') {
    loadUsers();
  }
  if (targetTab === 'orderKanbanPanel') {
    ensureKanbanDataLoaded();
  } else {
    renderOrderKanban();
  }
  syncCreateOrderFormDisabled();
}

dashboardTabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) {
      return;
    }
    setActiveDashboardTab(btn.dataset.tab);
  });
});

setActiveDashboardTab(activeDashboardTab);

if (currentYearElement) {
  currentYearElement.textContent = new Date().getFullYear();
}

function showToast(message, type = 'info') {
  if (!toastElement) return;
  const isError = type === 'error';
  toastElement.setAttribute('role', isError ? 'alert' : 'status');
  toastElement.setAttribute('aria-live', isError ? 'assertive' : 'polite');
  toastElement.textContent = '';
  toastElement.textContent = message;
  toastElement.className = `toast show ${isError ? 'error' : type === 'success' ? 'success' : ''}`;
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

function canModifyOrderTasks() {
  const role = state.user?.role;
  return role === 'administrador' || role === 'sastre';
}

function sortOrderTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const aTime = new Date(a?.created_at ?? 0).getTime();
    const bTime = new Date(b?.created_at ?? 0).getTime();
    const aInvalid = Number.isNaN(aTime);
    const bInvalid = Number.isNaN(bTime);
    if (aInvalid && bInvalid) {
      return (a?.id ?? 0) - (b?.id ?? 0);
    }
    if (aInvalid) return 1;
    if (bInvalid) return -1;
    if (aTime === bTime) {
      return (a?.id ?? 0) - (b?.id ?? 0);
    }
    return aTime - bTime;
  });
}

function resetOrderTasksState() {
  state.orderTasks = [];
  state.orderTasksOrderId = null;
  state.orderTasksLoading = false;
  state.orderTasksRequestId = 0;
  renderOrderTasks();
}

function renderOrderTasks() {
  if (!orderTasksList) return;
  const selectedOrderId = state.selectedOrderId;
  const tasksBelongToSelection =
    selectedOrderId !== null && state.orderTasksOrderId === selectedOrderId;
  const canModify = canModifyOrderTasks();
  const shouldShowForm = tasksBelongToSelection && canModify;

  if (orderTaskForm) {
    orderTaskForm.classList.toggle('hidden', !shouldShowForm);
  }
  if (orderTaskDescriptionInput) {
    orderTaskDescriptionInput.disabled = !canModify;
  }
  if (orderTasksPermissionsNotice) {
    const showNotice = tasksBelongToSelection && !canModify;
    orderTasksPermissionsNotice.classList.toggle('hidden', !showNotice);
  }

  if (!tasksBelongToSelection) {
    orderTasksList.classList.add('muted');
    orderTasksList.textContent =
      selectedOrderId === null
        ? 'Selecciona una orden para ver el checklist.'
        : 'Cargando checklist...';
    return;
  }

  if (state.orderTasksLoading) {
    orderTasksList.classList.add('muted');
    orderTasksList.textContent = 'Cargando checklist...';
    return;
  }

  const tasks = Array.isArray(state.orderTasks) ? state.orderTasks : [];
  orderTasksList.innerHTML = '';
  if (!tasks.length) {
    orderTasksList.classList.add('muted');
    orderTasksList.textContent = 'No hay tareas registradas.';
    return;
  }

  orderTasksList.classList.remove('muted');
  const list = document.createElement('ul');
  list.className = 'order-task-list';

  tasks.forEach((task, index) => {
    const item = document.createElement('li');
    item.className = 'order-task-item';

    const label = document.createElement('label');
    label.className = 'order-task-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === ORDER_TASK_STATUS_COMPLETED;
    checkbox.disabled = !canModify;
    checkbox.addEventListener('change', () => handleOrderTaskToggle(task.id, checkbox));
    label.appendChild(checkbox);

    const description = document.createElement('span');
    description.className = 'order-task-description';
    const rawDescription = typeof task.description === 'string' ? task.description.trim() : '';
    const fallbackLabel = 'Trabajo sin descripción';
    const displayDescription = rawDescription || fallbackLabel;
    description.textContent = displayDescription;
    description.title = displayDescription;
    label.appendChild(description);

    item.appendChild(label);

    const meta = document.createElement('div');
    meta.className = 'order-task-meta';

    const responsible = document.createElement('span');
    responsible.className = 'order-task-responsible';
    responsible.textContent = task.responsible?.full_name
      ? `Responsable: ${task.responsible.full_name}`
      : 'Responsable: Sin asignar';
    meta.appendChild(responsible);

    if (task.updated_at) {
      const updated = document.createElement('span');
      updated.className = 'order-task-updated';
      updated.textContent = `Actualizado: ${formatDate(task.updated_at)}`;
      meta.appendChild(updated);
    }

    if (task.responsible?.full_name) {
      const responsible = document.createElement('span');
      responsible.className = 'order-task-responsible';
      responsible.textContent = `Responsable: ${task.responsible.full_name}`;
      meta.appendChild(responsible);
    }

    if (meta.children.length > 0) {
      item.appendChild(meta);
    }

    list.appendChild(item);
  });

  orderTasksList.appendChild(list);
}

async function refreshOrderTasks(orderId) {
  if (!state.token) return;
  const requestId = Date.now();
  state.orderTasksRequestId = requestId;
  state.orderTasksOrderId = orderId;
  state.orderTasksLoading = true;
  renderOrderTasks();
  try {
    const tasks = await apiFetch(`/orders/${orderId}/tasks`);
    if (state.orderTasksRequestId !== requestId) {
      return;
    }
    const normalized = Array.isArray(tasks) ? tasks : [];
    state.orderTasks = sortOrderTasks(normalized);
  } catch (error) {
    if (state.orderTasksRequestId === requestId) {
      state.orderTasks = [];
      showToast(error.message, 'error');
    }
  } finally {
    if (state.orderTasksRequestId === requestId) {
      state.orderTasksLoading = false;
      renderOrderTasks();
    }
  }
}

function applyOrderTaskUpdate(updatedTask) {
  if (!updatedTask || typeof updatedTask !== 'object') return;
  if (state.orderTasksOrderId !== updatedTask.order_id) {
    return;
  }
  const tasks = Array.isArray(state.orderTasks) ? [...state.orderTasks] : [];
  const index = tasks.findIndex((task) => task.id === updatedTask.id);
  if (index === -1) {
    tasks.push(updatedTask);
  } else {
    tasks[index] = updatedTask;
  }
  state.orderTasks = sortOrderTasks(tasks);
  renderOrderTasks();
}

async function handleOrderTaskToggle(taskId, checkbox) {
  if (state.selectedOrderId === null || !checkbox) {
    return;
  }
  if (!canModifyOrderTasks()) {
    renderOrderTasks();
    return;
  }
  if (state.orderTasksOrderId !== state.selectedOrderId) {
    checkbox.checked = state.orderTasks.find((task) => task.id === taskId)?.status === ORDER_TASK_STATUS_COMPLETED;
    checkbox.disabled = !canModifyOrderTasks();
    return;
  }
  const currentTask = state.orderTasks.find((task) => task.id === taskId);
  const previousStatus = currentTask?.status || ORDER_TASK_STATUS_PENDING;
  const desiredStatus = checkbox.checked
    ? ORDER_TASK_STATUS_COMPLETED
    : ORDER_TASK_STATUS_PENDING;
  if (desiredStatus === previousStatus) {
    checkbox.disabled = !canModifyOrderTasks();
    return;
  }
  checkbox.disabled = true;
  try {
    const updatedTask = await apiFetch(`/orders/${state.selectedOrderId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: { status: desiredStatus },
    });
    applyOrderTaskUpdate(updatedTask);
    showToast('Checklist actualizado.', 'success');
  } catch (error) {
    checkbox.checked = previousStatus === ORDER_TASK_STATUS_COMPLETED;
    showToast(error.message, 'error');
  } finally {
    checkbox.disabled = !canModifyOrderTasks();
  }
}

async function handleOrderTaskCreate(event) {
  event.preventDefault();
  if (state.selectedOrderId === null) {
    showToast('Selecciona una orden antes de agregar tareas.', 'error');
    return;
  }
  if (state.orderTasksOrderId !== state.selectedOrderId) {
    showToast('Selecciona una orden antes de agregar tareas.', 'error');
    return;
  }
  if (!canModifyOrderTasks()) {
    showToast('No tienes permisos para modificar el checklist.', 'error');
    return;
  }
  const descriptionValue = orderTaskDescriptionInput?.value.trim() || '';
  if (!descriptionValue) {
    showToast('Ingresa la descripción del trabajo antes de agregarlo.', 'error');
    if (orderTaskDescriptionInput) {
      orderTaskDescriptionInput.focus();
    }
    return;
  }

  const submitButton = orderTaskForm?.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
  }
  try {
    const body = { description: descriptionValue };
    const newTask = await apiFetch(`/orders/${state.selectedOrderId}/tasks`, {
      method: 'POST',
      body,
    });
    applyOrderTaskUpdate(newTask);
    if (orderTaskDescriptionInput) {
      orderTaskDescriptionInput.value = '';
      orderTaskDescriptionInput.focus();
    }
    showToast('Tarea añadida al checklist.', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
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
    let message = 'Error en la solicitud';
    if (data) {
      if (Array.isArray(data.detail)) {
        message = data.detail
          .map((item) => {
            if (item?.msg) return item.msg;
            if (item?.detail) return item.detail;
            if (item?.message) return item.message;
            if (typeof item === 'string') return item;
            try {
              return JSON.stringify(item);
            } catch (error) {
              return 'Error en la solicitud';
            }
          })
          .join(' ');
      } else if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (data.detail?.msg) {
        message = data.detail.msg;
      } else if (data.detail?.message) {
        message = data.detail.message;
      } else if (typeof data.message === 'string') {
        message = data.message;
      } else if (typeof data === 'string') {
        message = data;
      }
    }
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

function populateVendorSelect(selectElement, selectedId = '', selectedLabel = '') {
  if (!selectElement) return;
  selectElement.innerHTML = '';
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Sin asignar';
  selectElement.appendChild(emptyOption);
  let hasSelected = false;
  state.vendors.forEach((vendor) => {
    const option = document.createElement('option');
    option.value = String(vendor.id);
    option.textContent = vendor.full_name;
    if (selectedId && String(selectedId) === String(vendor.id)) {
      option.selected = true;
      hasSelected = true;
    }
    selectElement.appendChild(option);
  });
  if (selectedId && !hasSelected) {
    const fallbackOption = document.createElement('option');
    fallbackOption.value = String(selectedId);
    fallbackOption.textContent = selectedLabel || 'Vendedor seleccionado';
    fallbackOption.selected = true;
    selectElement.appendChild(fallbackOption);
  }
}

function populateNewOrderTaskResponsibles() {
  if (!newOrderTasksList) return;

  const responsibleSelects = newOrderTasksList.querySelectorAll(
    'select[data-role="task-responsible"], select[data-field="responsible"]'
  );

  if (!responsibleSelects.length) return;

  responsibleSelects.forEach((selectElement) => {
    const selectedValue = selectElement.value || '';
    populateTailorSelect(selectElement, selectedValue);
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

function populateCustomerSelect(selectElement, selectedId) {
  if (!selectElement) return;
  const selectedValue =
    selectedId !== undefined && selectedId !== null && selectedId !== ''
      ? String(selectedId)
      : selectElement.value || '';
  selectElement.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona un cliente';
  if (!selectedValue) {
    placeholder.selected = true;
  }
  selectElement.appendChild(placeholder);
  (state.customerOptions || []).forEach((customer) => {
    const option = document.createElement('option');
    option.value = String(customer.id);
    option.textContent = `${customer.full_name} (${customer.document_id})`;
    if (selectedValue && String(selectedValue) === String(customer.id)) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

let measurementRowIdCounter = 0;
let newOrderTaskRowIdCounter = 0;

function createMeasurementRowElement(data = { nombre: '', valor: '' }, onRemove) {
  const row = document.createElement('div');
  row.className = 'measurement-row';

  measurementRowIdCounter += 1;
  const rowId = `measurement-${measurementRowIdCounter}`;
  const nameId = `${rowId}-name`;
  const valueId = `${rowId}-value`;

  const nameField = document.createElement('div');
  nameField.className = 'measurement-field';

  const nameLabel = document.createElement('label');
  nameLabel.className = 'sr-only';
  nameLabel.setAttribute('for', nameId);
  nameLabel.textContent = 'Nombre de la medida';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = nameId;
  nameInput.placeholder = 'Ej. Pecho';
  nameInput.value = data.nombre || '';
  nameInput.dataset.field = 'nombre';

  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);

  const valueField = document.createElement('div');
  valueField.className = 'measurement-field';

  const valueLabel = document.createElement('label');
  valueLabel.className = 'sr-only';
  valueLabel.setAttribute('for', valueId);
  valueLabel.textContent = 'Valor de la medida';

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.id = valueId;
  valueInput.placeholder = 'Ej. 98 cm';
  valueInput.value = data.valor || '';
  valueInput.dataset.field = 'valor';

  valueField.appendChild(valueLabel);
  valueField.appendChild(valueInput);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'danger ghost';
  removeButton.textContent = 'Eliminar';
  removeButton.addEventListener('click', () => {
    row.remove();
    if (typeof onRemove === 'function') {
      onRemove();
    }
  });

  row.appendChild(nameField);
  row.appendChild(valueField);
  row.appendChild(removeButton);

  return row;
}

function addMeasurementRow(data = { nombre: '', valor: '' }) {
  if (!measurementsList) return;
  const row = createMeasurementRowElement(data, () => ensureMeasurementRow());
  measurementsList.appendChild(row);
}

function highlightMeasurementRow(row) {
  if (!row) return;
  row.classList.add('is-highlighted');
  setTimeout(() => {
    row.classList.remove('is-highlighted');
  }, 1500);
}

function ensureAvailableMeasurementSlot() {
  if (!measurementsList) return;
  const rows = Array.from(measurementsList.querySelectorAll('.measurement-row'));
  const hasEmptyRow = rows.some((row) => {
    const nameInput = row.querySelector('input[data-field="nombre"]');
    const valueInput = row.querySelector('input[data-field="valor"]');
    return (
      nameInput &&
      valueInput &&
      !nameInput.value.trim() &&
      !valueInput.value.trim()
    );
  });
  if (!hasEmptyRow) {
    addMeasurementRow();
  }
}

function applyMeasurementToOrder(measurement) {
  if (!measurementsList) {
    return false;
  }
  if (!measurement) {
    return false;
  }
  const nombreSource = measurement.nombre;
  const valorSource = measurement.valor;
  const nombre =
    typeof nombreSource === 'string'
      ? nombreSource.trim()
      : nombreSource !== null && nombreSource !== undefined
        ? nombreSource.toString().trim()
        : '';
  const valor =
    typeof valorSource === 'string'
      ? valorSource.trim()
      : valorSource !== null && valorSource !== undefined
        ? valorSource.toString().trim()
        : '';
  if (!nombre || !valor) {
    return false;
  }

  const rows = Array.from(measurementsList.querySelectorAll('.measurement-row'));
  let targetRow = rows.find((row) => {
    const nameInput = row.querySelector('input[data-field="nombre"]');
    const valueInput = row.querySelector('input[data-field="valor"]');
    return (
      nameInput &&
      valueInput &&
      !nameInput.value.trim() &&
      !valueInput.value.trim()
    );
  });

  if (!targetRow) {
    addMeasurementRow({ nombre, valor });
    targetRow = measurementsList.lastElementChild;
  }

  if (!targetRow) {
    return false;
  }

  const nameInput = targetRow.querySelector('input[data-field="nombre"]');
  const valueInput = targetRow.querySelector('input[data-field="valor"]');
  if (!nameInput || !valueInput) {
    return false;
  }

  nameInput.value = nombre;
  valueInput.value = valor;

  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  valueInput.dispatchEvent(new Event('input', { bubbles: true }));

  ensureAvailableMeasurementSlot();
  highlightMeasurementRow(targetRow);
  if (typeof targetRow.scrollIntoView === 'function') {
    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return true;
}

function ensureMeasurementRow() {
  if (measurementsList && measurementsList.children.length === 0) {
    addMeasurementRow();
  }
}

if (addMeasurementButton) {
  addMeasurementButton.addEventListener('click', () => addMeasurementRow());
}

function createOrderTaskRowElement(data = { description: '' }) {

  const row = document.createElement('div');
  row.className = 'measurement-row order-task-input-row';
  row.dataset.role = 'order-task-row';

  newOrderTaskRowIdCounter += 1;
  const rowId = `new-order-task-${newOrderTaskRowIdCounter}`;
  const descriptionId = `${rowId}-description`;

  const descriptionField = document.createElement('div');
  descriptionField.className = 'measurement-field order-task-description-field';

  const labelElement = document.createElement('label');
  labelElement.className = 'order-task-input-label';
  labelElement.dataset.role = 'task-label';
  labelElement.setAttribute('for', descriptionId);
  labelElement.textContent = 'Trabajo #1';

  const descriptionInput = document.createElement('input');
  descriptionInput.type = 'text';
  descriptionInput.id = descriptionId;
  descriptionInput.dataset.field = 'description';
  descriptionInput.placeholder = 'Describe el trabajo a realizar';
  descriptionInput.maxLength = 255;
  descriptionInput.value =
    typeof data.description === 'string' && data.description ? data.description : '';

  descriptionField.appendChild(labelElement);
  descriptionField.appendChild(descriptionInput);


  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'danger ghost';
  removeButton.textContent = 'Eliminar';
  removeButton.addEventListener('click', () => {
    row.remove();
    updateNewOrderTaskLabels();
    ensureNewOrderTaskRow();
  });

  row.appendChild(descriptionField);

  row.appendChild(removeButton);

  return row;
}

function addNewOrderTaskRow(data = { description: '' }) {

  if (!newOrderTasksList) return;
  const row = createOrderTaskRowElement(data);
  newOrderTasksList.appendChild(row);
  updateNewOrderTaskLabels();

}

function ensureNewOrderTaskRow() {
  if (newOrderTasksList && newOrderTasksList.children.length === 0) {
    addNewOrderTaskRow();
  }
  updateNewOrderTaskLabels();
}

function collectNewOrderTasks() {
  if (!newOrderTasksList) {
    return { tasks: [], firstInput: null };
  }
  const rows = Array.from(newOrderTasksList.children);
  const tasks = [];
  let firstInput = null;

  rows.forEach((row) => {
    const input = row.querySelector('input[data-field="description"]');
    if (!input) {
      return;
    }
    if (!firstInput) {
      firstInput = input;
    }
    const value = input.value.trim();
    if (value) {
      tasks.push({ description: value });
    }
  });

  return { tasks, firstInput };
}

function updateNewOrderTaskLabels() {
  if (!newOrderTasksList) return;
  const rows = Array.from(newOrderTasksList.children);
  rows.forEach((row, index) => {
    const label = row.querySelector('[data-role="task-label"]');
    if (label) {
      label.textContent = `Trabajo #${index + 1}`;
    }
  });

}

if (addOrderTaskButton) {
  addOrderTaskButton.addEventListener('click', () => addNewOrderTaskRow());
}

function addMeasurementRowToList(listElement, data = { nombre: '', valor: '' }) {
  if (!listElement) return;
  const row = createMeasurementRowElement(data, () => {
    if (listElement.children.length === 0) {
      addMeasurementRowToList(listElement);
    }
  });
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
  const defaultVendorId =
    state.user?.role === 'vendedor' && state.user?.id ? String(state.user.id) : '';
  const defaultVendorLabel = defaultVendorId ? state.user?.full_name || '' : '';
  populateVendorSelect(assignVendorSelect, defaultVendorId, defaultVendorLabel);
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
  if (newOrderTasksList) {
    newOrderTasksList.innerHTML = '';
    addNewOrderTaskRow();
  }
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
        const tagButton = document.createElement('button');
        tagButton.type = 'button';
        tagButton.className = 'tag measurement-tag-button';
        tagButton.textContent = `${item.nombre}: ${item.valor}`;
        tagButton.title = 'Copiar esta medida a la orden';
        tagButton.addEventListener('click', () => {
          const applied = applyMeasurementToOrder(item);
          if (applied) {
            showToast(`Se copió la medida "${item.nombre}" a la orden.`, 'success');
          } else {
            showToast('No se pudo copiar la medida. Regístrala manualmente.', 'error');
          }
        });
        tags.appendChild(tagButton);
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
  if (!state.user) {
    updateUserCreationForm();
    return;
  }
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
  if (usersTabButton) {
    usersTabButton.classList.toggle('hidden', !isAdmin);
  }
  const isTailor = state.user.role === 'sastre';
  if (orderCreateTabButton) {
    if (isTailor) {
      orderCreateTabButton.classList.add('hidden');
    } else {
      orderCreateTabButton.classList.remove('hidden');
    }
    orderCreateTabButton.disabled = isTailor;
  }
  if (orderCreatePanel && isTailor) {
    orderCreatePanel.classList.add('hidden');
  }
  if (!isAdmin && activeDashboardTab === 'auditLogPanel') {
    setActiveDashboardTab('orderListPanel');
  } else if (isTailor && activeDashboardTab === 'orderCreatePanel') {
    setActiveDashboardTab('orderListPanel');
  } else {
    setActiveDashboardTab(activeDashboardTab);
  }
  updateUserCreationForm();
  renderOrderTasks();
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

async function bootstrapAuthenticatedSession({ showWelcomeToast = false } = {}) {
  state.customerSearchTerm = '';
  state.orderSearchTerm = '';
  if (customerSearchInput) {
    customerSearchInput.value = '';
  }
  if (orderSearchInput) {
    orderSearchInput.value = '';
  }

  await loadCurrentUser();
  updateUserInfo();
  await loadStatuses();
  await loadTailors();
  await loadVendors();
  await loadCustomers();
  await refreshCustomerOptions();
  await loadOrders();
  if (state.user?.role === 'administrador') {
    await loadUsers();
    await loadAuditLogs();
  } else {
    state.users = [];
    state.usersLoaded = false;
    state.usersLoadError = null;
    renderUsers();
  }

  setCreateCustomerVisible(false);
  setCreateUserVisible(false);
  resetCreateOrderForm();
  showDashboard();
  updateNavigationForAuth();
  setActiveView('staff-view');

  if (showWelcomeToast) {
    showToast('Bienvenido, sesión iniciada.', 'success');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const submitButton = staffLoginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const tokenResponse = await apiFetch('/auth/login', {
      method: 'POST',
      body: { username, password },
      auth: false,
    });
    const rawToken = typeof tokenResponse?.access_token === 'string' ? tokenResponse.access_token : '';
    const accessToken = rawToken.trim();
    if (!accessToken) {
      throw new Error('Token de autenticación inválido.');
    }
    state.token = accessToken;
    persistToken(state.token);
    await bootstrapAuthenticatedSession({ showWelcomeToast: true });
  } catch (error) {
    if (state.token) {
      handleLogout(false);
    }
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
  populateTailorSelect(orderTaskResponsibleSelect);
  populateNewOrderTaskResponsibles();
  if (orderDetailTailorSelect) {
    const selectedValue =
      orderDetailTailorSelect.value ||
      (state.selectedOrderId !== null
        ? state.orders.find((order) => order.id === state.selectedOrderId)?.assigned_tailor?.id ?? ''
        : '');
    populateTailorSelect(orderDetailTailorSelect, selectedValue);
  }
}

async function loadVendors() {
  if (!state.token) return;
  const role = state.user?.role;
  if (role !== 'administrador' && role !== 'vendedor') {
    state.vendors = [];
    populateVendorSelect(assignVendorSelect);
    if (orderDetailVendorSelect) {
      const selectedDetailValue =
        state.selectedOrderId !== null
          ? state.orders.find((order) => order.id === state.selectedOrderId)?.assigned_vendor?.id ?? ''
          : '';
      const selectedDetailLabel =
        state.selectedOrderId !== null
          ? state.orders.find((order) => order.id === state.selectedOrderId)?.assigned_vendor?.full_name || ''
          : '';
      populateVendorSelect(orderDetailVendorSelect, selectedDetailValue, selectedDetailLabel);
    }
    return;
  }
  try {
    state.vendors = await apiFetch('/users/vendors');
  } catch (error) {
    state.vendors = [];
    showToast(error.message, 'error');
  }
  let selectedCreateValue = assignVendorSelect?.value || '';
  let selectedCreateLabel = '';
  if (!selectedCreateValue && state.user?.role === 'vendedor' && state.user?.id) {
    selectedCreateValue = String(state.user.id);
    selectedCreateLabel = state.user?.full_name || '';
  }
  populateVendorSelect(assignVendorSelect, selectedCreateValue, selectedCreateLabel);
  if (orderDetailVendorSelect) {
    let selectedDetailValue = orderDetailVendorSelect.value || '';
    let selectedDetailLabel = '';
    if (!selectedDetailValue && state.selectedOrderId !== null) {
      const activeOrder = state.orders.find((order) => order.id === state.selectedOrderId);
      if (activeOrder?.assigned_vendor?.id) {
        selectedDetailValue = String(activeOrder.assigned_vendor.id);
        selectedDetailLabel = activeOrder.assigned_vendor.full_name || '';
      }
    }
    populateVendorSelect(orderDetailVendorSelect, selectedDetailValue, selectedDetailLabel);
  }
}

async function loadOrders({ page, pageSize } = {}) {
  if (!state.token) return null;
  const requestedPage = Number(page);
  const normalizedPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : Number(state.orderPage) || 1;
  const requestedPageSize = Number(pageSize ?? state.orderPageSize ?? DEFAULT_PAGE_SIZE);
  const normalizedPageSize = getValidPageSize(requestedPageSize);
  const params = new URLSearchParams({
    page: String(Math.max(normalizedPage, 1)),
    page_size: String(normalizedPageSize),
  });
  const trimmedSearch = state.orderSearchTerm.trim();
  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }
  const requestId = Date.now();
  state.orderRequestId = requestId;
  try {
    const response = await apiFetch(`/orders?${params.toString()}`);
    if (state.orderRequestId !== requestId) {
      return null;
    }
    const items = Array.isArray(response?.items) ? response.items : [];
    const total = typeof response?.total === 'number' ? response.total : items.length;
    const resolvedPageSize = getValidPageSize(response?.page_size ?? normalizedPageSize);
    const resolvedPage = response?.page && response.page > 0 ? response.page : 1;
    state.orders = items;
    state.orderTotal = total;
    state.orderPageSize = resolvedPageSize;
    state.orderPage = resolvedPage;
    if (state.selectedOrderId !== null) {
      const selected = items.find((order) => order.id === state.selectedOrderId);
      if (selected) {
        populateOrderDetail(selected, { skipRender: true, focusOnDetail: false });
      } else {
        clearOrderDetail({ skipRender: true });
      }
    }
    renderOrders();
    return response;
  } catch (error) {
    if (state.orderRequestId === requestId) {
      showToast(error.message, 'error');
    }
    return null;
  }
}

async function loadKanbanOrders({ force = false } = {}) {
  if (!state.token) {
    state.kanbanOrders = [];
    state.kanbanLastUpdated = null;
    state.kanbanNeedsRefresh = true;
    renderOrderKanban();
    return;
  }

  if (state.kanbanLoading) {
    return;
  }

  if (!force && !state.kanbanNeedsRefresh && state.kanbanOrders.length) {
    renderOrderKanban();
    return;
  }

  state.kanbanLoading = true;
  state.kanbanError = null;
  renderOrderKanban();

  const collected = [];
  let page = 1;
  let total = 0;

  try {
    while (true) {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(KANBAN_FETCH_PAGE_SIZE),
      });
      const response = await apiFetch(`/orders?${params.toString()}`);
      const items = Array.isArray(response?.items) ? response.items : [];
      const reportedTotal = typeof response?.total === 'number' ? response.total : total;
      if (reportedTotal) {
        total = reportedTotal;
      }
      collected.push(...items);
      if (collected.length >= total || !items.length) {
        break;
      }
      page += 1;
    }

    state.kanbanOrders = collected;
    state.kanbanLastUpdated = new Date().toISOString();
    state.kanbanNeedsRefresh = false;
    state.kanbanError = null;
  } catch (error) {
    state.kanbanError = error.message || 'No se pudieron cargar las órdenes.';
    showToast(state.kanbanError, 'error');
  } finally {
    state.kanbanLoading = false;
    renderOrderKanban();
  }
}

function ensureKanbanDataLoaded() {
  if (!state.token) {
    renderOrderKanban();
    return;
  }
  if (state.kanbanLoading) {
    renderOrderKanban();
    return;
  }
  if (state.kanbanNeedsRefresh || !state.kanbanOrders.length) {
    loadKanbanOrders({ force: true });
  } else {
    renderOrderKanban();
  }
}

function markKanbanDataStale() {
  state.kanbanNeedsRefresh = true;
  renderOrderKanban();
  if (activeDashboardTab === 'orderKanbanPanel' && state.token && !state.kanbanLoading) {
    loadKanbanOrders({ force: true });
  }
}

async function loadCustomers({ page, pageSize } = {}) {
  if (!state.token) return null;
  const requestedPage = Number(page);
  const normalizedPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : Number(state.customerPage) || 1;
  const requestedPageSize = Number(pageSize ?? state.customerPageSize ?? DEFAULT_PAGE_SIZE);
  const normalizedPageSize = getValidPageSize(requestedPageSize);
  const params = new URLSearchParams({
    page: String(Math.max(normalizedPage, 1)),
    page_size: String(normalizedPageSize),
  });
  const trimmedSearch = state.customerSearchTerm.trim();
  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }
  const requestId = Date.now();
  state.customerRequestId = requestId;
  try {
    const response = await apiFetch(`/customers?${params.toString()}`);
    if (state.customerRequestId !== requestId) {
      return null;
    }
    const items = Array.isArray(response?.items) ? response.items : [];
    const total = typeof response?.total === 'number' ? response.total : items.length;
    const resolvedPageSize = getValidPageSize(response?.page_size ?? normalizedPageSize);
    const resolvedPage = response?.page && response.page > 0 ? response.page : 1;
    state.customers = items;
    state.customerTotal = total;
    state.customerPageSize = resolvedPageSize;
    state.customerPage = resolvedPage;
    renderCustomers();
    if (orderCustomerSelect) {
      populateCustomerSelect(orderCustomerSelect);
      handleOrderCustomerChange();
    }
    if (state.selectedCustomerId) {
      const selected = items.find((customer) => customer.id === state.selectedCustomerId);
      if (selected) {
        await populateCustomerDetail(selected);
      } else {
        clearCustomerDetail();
      }
    } else {
      clearCustomerDetail();
    }
    return response;
  } catch (error) {
    if (state.customerRequestId === requestId) {
      showToast(error.message, 'error');
    }
    return null;
  }
}

async function refreshCustomerOptions() {
  if (!state.token) return;
  const pageSize = 100;
  const requestId = Date.now();
  state.customerOptionsRequestId = requestId;
  const collected = [];
  let total = 0;
  let page = 1;
  try {
    while (true) {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      const response = await apiFetch(`/customers?${params.toString()}`);
      if (state.customerOptionsRequestId !== requestId) {
        return;
      }
      const items = Array.isArray(response?.items) ? response.items : [];
      total = typeof response?.total === 'number' ? response.total : total;
      collected.push(...items);
      if (collected.length >= total || !items.length) {
        break;
      }
      page += 1;
    }
    state.customerOptions = collected;
    if (orderCustomerSelect) {
      populateCustomerSelect(orderCustomerSelect, orderCustomerSelect.value || '');
      handleOrderCustomerChange();
    }
  } catch (error) {
    if (state.customerOptionsRequestId === requestId) {
      showToast(error.message, 'error');
    }
  }
}

async function fetchOrdersForCustomer(customerId) {
  if (!state.token) return [];
  const numericId = Number(customerId);
  if (!Number.isFinite(numericId)) {
    return [];
  }
  const cacheKey = String(numericId);
  const pageSize = 50;
  const collected = [];
  let total = 0;
  let page = 1;
  try {
    while (true) {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        customer_id: String(numericId),
      });
      const response = await apiFetch(`/orders?${params.toString()}`);
      const items = Array.isArray(response?.items) ? response.items : [];
      total = typeof response?.total === 'number' ? response.total : total;
      collected.push(...items);
      if (collected.length >= total || !items.length) {
        break;
      }
      page += 1;
    }
    state.customerOrdersCache[cacheKey] = {
      items: sortOrdersByRecency(collected),
      total: total || collected.length,
      complete: true,
    };
  } catch (error) {
    showToast(error.message, 'error');
    state.customerOrdersCache[cacheKey] = {
      items: sortOrdersByRecency(collected),
      total: collected.length,
      complete: false,
    };
  }
  return state.customerOrdersCache[cacheKey]?.items ?? [];
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

async function loadUsers() {
  if (!state.token || state.user?.role !== 'administrador') {
    return;
  }
  state.usersLoadError = null;
  state.usersLoaded = false;
  renderUsers();
  try {
    state.users = await apiFetch('/users');
    state.usersLoaded = true;
    state.usersLoadError = null;
  } catch (error) {
    state.users = [];
    state.usersLoaded = false;
    state.usersLoadError = error.message || 'No se pudieron cargar los usuarios.';
    showToast(error.message, 'error');
  }
  renderUsers();
}

async function loadCurrentUser() {
  state.user = await apiFetch('/users/me');
}

function handleLogout(auto = false) {
  clearStoredToken();
  state.token = null;
  state.user = null;
  state.orders = [];
  state.tailors = [];
  state.vendors = [];
  state.customers = [];
  state.customerOptions = [];
  state.customerOrdersCache = {};
  state.customerDisplayCache = {};
  state.customerSearchTerm = '';
  state.orderSearchTerm = '';
  state.customerPage = 1;
  state.customerPageSize = DEFAULT_PAGE_SIZE;
  state.orderPage = 1;
  state.orderPageSize = DEFAULT_PAGE_SIZE;
  state.customerTotal = 0;
  state.orderTotal = 0;
  state.kanbanOrders = [];
  state.kanbanLoading = false;
  state.kanbanError = null;
  state.kanbanSearchTerm = '';
  state.kanbanNeedsRefresh = true;
  state.kanbanLastUpdated = null;
  state.isCreateCustomerVisible = false;
  state.isCreateUserVisible = false;
  state.auditLogs = [];
  state.selectedCustomerId = null;
  state.selectedOrderId = null;
  state.orderTasks = [];
  state.orderTasksOrderId = null;
  state.orderTasksLoading = false;
  state.orderTasksRequestId = 0;
  state.customerRequestId = 0;
  state.orderRequestId = 0;
  state.customerOptionsRequestId = 0;
  state.users = [];
  state.usersLoaded = false;
  state.usersLoadError = null;
  state.editingUserId = null;
  if (currentUserNameElement) {
    currentUserNameElement.textContent = '';
  }
  if (currentUserRoleElement) {
    currentUserRoleElement.textContent = '';
  }
  if (assignTailorSelect) {
    populateTailorSelect(assignTailorSelect);
  }
  if (assignVendorSelect) {
    populateVendorSelect(assignVendorSelect);
  }
  if (orderTaskDescriptionInput) {
    orderTaskDescriptionInput.value = '';

  }
  if (orderCustomerSelect) {
    populateCustomerSelect(orderCustomerSelect);
  }
  if (auditLogTabButton) {
    auditLogTabButton.classList.add('hidden');
  }
  if (usersTabButton) {
    usersTabButton.classList.add('hidden');
  }
  setActiveDashboardTab('orderListPanel');
  hideDashboard();
  if (customerSearchInput) {
    customerSearchInput.value = '';
  }
  if (orderSearchInput) {
    orderSearchInput.value = '';
  }
  if (orderKanbanSearchInput) {
    orderKanbanSearchInput.value = '';
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
  if (orderKanbanColumns) {
    orderKanbanColumns.innerHTML = '';
  }
  if (orderKanbanStatus) {
    orderKanbanStatus.textContent = '';
    orderKanbanStatus.classList.add('hidden');
  }
  if (orderDetailVendorSelect) {
    populateVendorSelect(orderDetailVendorSelect);
  }
  if (customersTableBody) {
    customersTableBody.innerHTML = '';
  }
  if (auditLogTableBody) {
    auditLogTableBody.innerHTML = '';
  }
  if (usersTableBody) {
    usersTableBody.innerHTML = '';
  }
  clearCustomerDetail();
  clearOrderDetail({ skipRender: true });
  resetCreateCustomerForm();
  resetCreateUserForm();
  clearUserEditForm();
  updateUserCreationForm();
  renderUsers();

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
  renderUsers();
  renderOrderTasks();
  renderOrderKanban();
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
  const key = String(numericId);
  const cached = state.customerOrdersCache?.[key];
  if (cached?.items) {
    return cached.items;
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

function getCustomerDisplayData(customer, ordersForCustomer = []) {
  const normalizedName =
    typeof customer?.full_name === 'string' ? customer.full_name.trim() : '';
  const normalizedDocument =
    typeof customer?.document_id === 'string' ? customer.document_id.trim() : '';
  const normalizedContact =
    typeof customer?.phone === 'string' ? customer.phone.trim() : '';

  const cacheKey =
    customer?.id !== null && customer?.id !== undefined ? String(customer.id) : null;
  const cachedDisplay =
    cacheKey && state.customerDisplayCache ? state.customerDisplayCache[cacheKey] || {} : {};

  let fallbackName = '';
  let fallbackDocument = '';
  let fallbackContact = '';

  if (!normalizedName || !normalizedDocument || !normalizedContact) {
    const orderList = Array.isArray(ordersForCustomer) ? ordersForCustomer : [];
    const ordersByRecency = sortOrdersByRecency(orderList);
    for (const order of ordersByRecency) {
      if (!fallbackName && typeof order?.customer_name === 'string') {
        const trimmed = order.customer_name.trim();
        if (trimmed) {
          fallbackName = trimmed;
        }
      }
      if (!fallbackDocument && typeof order?.customer_document === 'string') {
        const trimmed = order.customer_document.trim();
        if (trimmed) {
          fallbackDocument = trimmed;
        }
      }
      if (!fallbackContact && typeof order?.customer_contact === 'string') {
        const trimmed = order.customer_contact.trim();
        if (trimmed) {
          fallbackContact = trimmed;
        }
      }
      if (fallbackName && fallbackDocument && fallbackContact) {
        break;
      }
    }
  }

  const name = normalizedName || fallbackName || cachedDisplay.name || '';
  const document = normalizedDocument || fallbackDocument || cachedDisplay.document || '';
  const contact = normalizedContact || fallbackContact || cachedDisplay.contact || '';

  if (cacheKey) {
    if (!state.customerDisplayCache) {
      state.customerDisplayCache = {};
    }
    state.customerDisplayCache[cacheKey] = {
      name,
      document,
      contact,
    };
  }

  return {
    name,
    document,
    contact,
  };
}


function showCustomerOrderHistoryLoading() {
  if (!customerOrderHistoryContainer) return;
  customerOrderHistoryContainer.classList.add('muted');
  customerOrderHistoryContainer.textContent = 'Cargando historial de órdenes...';
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

  const totalItems =
    typeof state.customerTotal === 'number'
      ? state.customerTotal
      : state.customers.length;

  const normalizedPage =
    updatePaginationControls({
      infoElement: customerPaginationInfo,
      prevButton: customerPrevPageButton,
      nextButton: customerNextPageButton,
      pageSizeSelect: customerPageSizeSelect,
      currentPage: state.customerPage || 1,
      totalItems,
      pageSize,
      emptyLabel: 'clientes',
    }) || (state.customerPage || 1);

  if (state.customerPage !== normalizedPage) {
    state.customerPage = normalizedPage;
  }

  if (!state.customers.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = CUSTOMER_TABLE_COLUMN_COUNT;
    const hasSearch = Boolean(state.customerSearchTerm.trim());
    if (totalItems === 0) {
      cell.textContent = hasSearch
        ? 'No se encontraron clientes que coincidan con la búsqueda.'
        : 'No hay clientes registrados aún.';
      clearCustomerDetail();
    } else {
      cell.textContent = 'No hay clientes para la página seleccionada.';
    }
    cell.className = 'muted';
    row.appendChild(cell);
    customersTableBody.appendChild(row);
    if (customerDetail) {
      customerDetail.classList.add('hidden');
      activeCustomerDetailRow = null;
    }
    return;
  }

  let detailRendered = false;

  state.customers.forEach((customer) => {
    const row = document.createElement('tr');
    row.classList.add('customer-row');
    row.dataset.customerId = String(customer.id);

    const isSelected = state.selectedCustomerId === customer.id;
    if (isSelected) {
      row.classList.add('is-selected');
    }

    const cachedOrders = getOrdersForCustomer(customer.id);
    const orderCount =
      typeof customer.order_count === 'number'
        ? customer.order_count
        : cachedOrders.length;
    const displayData = getCustomerDisplayData(customer, cachedOrders);

    const nameCell = document.createElement('td');
    nameCell.dataset.label = 'Nombre';
    nameCell.textContent = displayData.name || '—';

    const documentCell = document.createElement('td');
    documentCell.dataset.label = 'Documento';
    documentCell.textContent = displayData.document || '—';

    const phoneCell = document.createElement('td');
    phoneCell.dataset.label = 'Teléfono';
    phoneCell.textContent = displayData.contact || '—';

    const orderCountCell = document.createElement('td');
    orderCountCell.className = 'customer-order-count-cell';
    orderCountCell.dataset.label = 'Órdenes';
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
    actionsCell.dataset.label = 'Acciones';
    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.className = 'secondary';
    viewButton.dataset.action = 'toggle-customer-detail';
    viewButton.dataset.customerId = String(customer.id);
    viewButton.setAttribute('aria-controls', 'customerDetail');
    viewButton.textContent = isSelected ? 'Ocultar detalle' : 'Ver detalle';
    viewButton.setAttribute('aria-expanded', isSelected ? 'true' : 'false');
    viewButton.addEventListener('click', async () => {
      if (state.selectedCustomerId === customer.id) {
        clearCustomerDetail({ reRender: true });
      } else {
        await populateCustomerDetail(customer);
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

async function populateCustomerDetail(customer) {
  if (!customerDetail) return;
  state.selectedCustomerId = customer.id;
  customerDetail.classList.remove('hidden');

  const cacheKey = String(customer.id);
  const expectedOrderCount =
    typeof customer.order_count === 'number' ? customer.order_count : undefined;
  const cached = state.customerOrdersCache[cacheKey];
  const cachedItems = Array.isArray(cached?.items) ? cached.items : [];
  const cacheComplete = cached?.complete === true;
  const hasCache = Boolean(cached);
  const needsFetch =
    expectedOrderCount !== undefined
      ? !cacheComplete || cachedItems.length < expectedOrderCount
      : !hasCache || !cacheComplete;

  if (needsFetch) {
    showCustomerOrderHistoryLoading();
    await fetchOrdersForCustomer(customer.id);
  }

  const ordersForCustomer = getOrdersForCustomer(customer.id);
  const displayData = getCustomerDisplayData(customer, ordersForCustomer);

  if (customerDetailTitle) {
    customerDetailTitle.textContent = displayData.name || CUSTOMER_DETAIL_DEFAULT_TITLE;
  }

  if (customerDetailSummaryElement) {
    const summaryParts = [];
    if (displayData.document) {
      summaryParts.push(`Documento: ${displayData.document}`);
    }
    if (displayData.contact) {
      summaryParts.push(`Teléfono: ${displayData.contact}`);
    }
    const orderCountForSummary =
      typeof expectedOrderCount === 'number' ? expectedOrderCount : ordersForCustomer.length;
    if (orderCountForSummary > 0) {
      const label =
        orderCountForSummary === 1
          ? '1 orden registrada'
          : `${orderCountForSummary} órdenes registradas`;
      summaryParts.push(label);
    }
    customerDetailSummaryElement.textContent =
      summaryParts.length ? summaryParts.join(' • ') : 'Sin datos de contacto registrados.';
  }

  const nameInput = updateCustomerNameInput || customerDetail?.querySelector('#updateCustomerName');
  const documentInput =
    updateCustomerDocumentInput || customerDetail?.querySelector('#updateCustomerDocument');
  const phoneInput = updateCustomerPhoneInput || customerDetail?.querySelector('#updateCustomerPhone');

  const normalizedCustomerName =
    typeof customer?.full_name === 'string' ? customer.full_name.trim() : '';
  const normalizedCustomerDocument =
    typeof customer?.document_id === 'string' ? customer.document_id.trim() : '';
  const normalizedCustomerPhone =
    typeof customer?.phone === 'string' ? customer.phone.trim() : '';
  if (nameInput) {
    nameInput.value = normalizedCustomerName || displayData.name || '';
  }
  if (documentInput) {
    documentInput.value = normalizedCustomerDocument || displayData.document || '';
  }
  if (phoneInput) {
    phoneInput.value = normalizedCustomerPhone || displayData.contact || '';
  }

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

  removeCustomerDetailRow();

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
  state.orderTasksOrderId = order.id;
  state.orderTasksLoading = true;
  state.orderTasks = [];
  renderOrderTasks();
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
  if (orderDetailVendorSelect) {
    populateVendorSelect(
      orderDetailVendorSelect,
      order.assigned_vendor?.id ?? '',
      order.assigned_vendor?.full_name || '',
    );
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

  refreshOrderTasks(order.id);
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
  if (orderDetailVendorSelect) populateVendorSelect(orderDetailVendorSelect);
  if (orderDetailInvoiceInput) orderDetailInvoiceInput.value = '';
  if (orderDetailOriginSelect) populateEstablishmentSelect(orderDetailOriginSelect);
  if (orderDetailDeliveryDateInput) orderDetailDeliveryDateInput.value = '';
  if (orderDetailNotesTextarea) orderDetailNotesTextarea.value = '';
  if (orderDetailMeasurementsContainer) {
    orderDetailMeasurementsContainer.innerHTML = '';
    orderDetailMeasurementsContainer.classList.add('muted');
  }

  resetOrderTasksState();

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
  const currentOrder = state.orders.find((order) => order.id === state.selectedOrderId);
  const affectedCustomerId = currentOrder?.customer_id;
  const deliveryDateValueRaw = orderDetailDeliveryDateInput?.value || '';
  const deliveryDateValue = normalizeDateForApi(deliveryDateValueRaw);
  const invoiceValue = invoiceValueRaw || null;
  let orderUpdatedSuccessfully = false;
  try {
    await apiFetch(`/orders/${state.selectedOrderId}`, {
      method: 'PATCH',
      body: {
        status: orderDetailStatusSelect?.value,
        assigned_tailor_id: orderDetailTailorSelect?.value
          ? Number(orderDetailTailorSelect.value)
          : null,
        assigned_vendor_id: orderDetailVendorSelect?.value
          ? Number(orderDetailVendorSelect.value)
          : null,
        customer_contact: orderDetailContactInput?.value.trim() || null,
        notes: orderDetailNotesTextarea?.value.trim() || null,
        delivery_date: deliveryDateValue ? deliveryDateValue : null,
        invoice_number: invoiceValue,
        origin_branch: originBranchValue,
      },
    });
    orderUpdatedSuccessfully = true;
    if (affectedCustomerId) {
      delete state.customerOrdersCache[String(affectedCustomerId)];
      delete state.customerDisplayCache[String(affectedCustomerId)];
    }
    showToast('Orden actualizada.', 'success');
    await loadOrders();
    if (affectedCustomerId && state.selectedCustomerId === affectedCustomerId) {
      const refreshedCustomer = state.customers.find(
        (customer) => customer.id === affectedCustomerId,
      );
      if (refreshedCustomer) {
        await populateCustomerDetail(refreshedCustomer);
      }
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
    if (orderUpdatedSuccessfully) {
      markKanbanDataStale();
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

let customerSearchDebounce = null;
let orderSearchDebounce = null;

if (customerSearchInput) {
  customerSearchInput.addEventListener('input', (event) => {
    state.customerSearchTerm = event.target.value;
    state.customerPage = 1;
    if (customerSearchDebounce) {
      clearTimeout(customerSearchDebounce);
    }
    customerSearchDebounce = setTimeout(() => {
      loadCustomers({ page: 1 });
    }, 250);
  });
}

if (orderSearchInput) {
  orderSearchInput.addEventListener('input', (event) => {
    state.orderSearchTerm = event.target.value;
    state.orderPage = 1;
    if (orderSearchDebounce) {
      clearTimeout(orderSearchDebounce);
    }
    orderSearchDebounce = setTimeout(() => {
      loadOrders({ page: 1 });
    }, 250);
  });
}

if (orderKanbanSearchInput) {
  orderKanbanSearchInput.addEventListener('input', (event) => {
    state.kanbanSearchTerm = event.target.value;
    renderOrderKanban();
  });
}

if (orderKanbanRefreshButton) {
  orderKanbanRefreshButton.addEventListener('click', () => {
    loadKanbanOrders({ force: true });
  });
}

if (customerPageSizeSelect) {
  customerPageSizeSelect.addEventListener('change', (event) => {
    const newSize = getValidPageSize(event.target.value);
    state.customerPageSize = newSize;
    state.customerPage = 1;
    loadCustomers({ page: 1, pageSize: newSize });
  });
}

if (customerPrevPageButton) {
  customerPrevPageButton.addEventListener('click', () => {
    const currentPage = Number(state.customerPage) || 1;
    if (currentPage > 1) {
      const previousPage = currentPage - 1;
      state.customerPage = previousPage;
      loadCustomers({ page: previousPage });
    }
  });
}

if (customerNextPageButton) {
  customerNextPageButton.addEventListener('click', () => {
    const nextPage = (Number(state.customerPage) || 1) + 1;
    state.customerPage = nextPage;
    loadCustomers({ page: nextPage });
  });
}

if (orderPageSizeSelect) {
  orderPageSizeSelect.addEventListener('change', (event) => {
    const newSize = getValidPageSize(event.target.value);
    state.orderPageSize = newSize;
    state.orderPage = 1;
    loadOrders({ page: 1, pageSize: newSize });
  });
}

if (orderPrevPageButton) {
  orderPrevPageButton.addEventListener('click', () => {
    const currentPage = Number(state.orderPage) || 1;
    if (currentPage > 1) {
      const previousPage = currentPage - 1;
      state.orderPage = previousPage;
      loadOrders({ page: previousPage });
    }
  });
}

if (orderNextPageButton) {
  orderNextPageButton.addEventListener('click', () => {
    const nextPage = (Number(state.orderPage) || 1) + 1;
    state.orderPage = nextPage;
    loadOrders({ page: nextPage });
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

if (toggleCreateUserButton) {
  toggleCreateUserButton.addEventListener('click', () => {
    const shouldShow = !state.isCreateUserVisible;
    setCreateUserVisible(shouldShow);
  });
}

if (closeCreateUserButton) {
  closeCreateUserButton.addEventListener('click', () => {
    setCreateUserVisible(false);
    toggleCreateUserButton?.focus();
  });
}


if (updateOrderForm) {
  updateOrderForm.addEventListener('submit', handleOrderUpdate);
}

if (orderTaskForm) {
  orderTaskForm.addEventListener('submit', handleOrderTaskCreate);
}

if (createUserForm) {
  createUserForm.addEventListener('submit', handleCreateUser);
}

if (editUserForm) {
  editUserForm.addEventListener('submit', handleEditUserSubmit);
}

if (cancelEditUserButton) {
  cancelEditUserButton.addEventListener('click', () => {
    cancelUserEdit({ focusTable: true });
  });
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
      await refreshCustomerOptions();
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
    const fullNameInput =
      updateCustomerNameInput || customerDetail?.querySelector('#updateCustomerName');
    const documentInput =
      updateCustomerDocumentInput || customerDetail?.querySelector('#updateCustomerDocument');
    const phoneInput =
      updateCustomerPhoneInput || customerDetail?.querySelector('#updateCustomerPhone');
    const fullName = fullNameInput?.value.trim() || '';
    const documentId = documentInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';
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
      await refreshCustomerOptions();
      const refreshed = state.customers.find((customer) => customer.id === state.selectedCustomerId);
      if (refreshed) {
        await populateCustomerDetail(refreshed);
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
      const deletedId = state.selectedCustomerId;
      await apiFetch(`/customers/${state.selectedCustomerId}`, { method: 'DELETE' });
      showToast('Cliente eliminado correctamente.', 'success');
      if (deletedId !== null && deletedId !== undefined) {
        delete state.customerOrdersCache[String(deletedId)];
        delete state.customerDisplayCache[String(deletedId)];
      }
      state.selectedCustomerId = null;
      await loadCustomers();
      await refreshCustomerOptions();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}
async function createOrder(event) {
  event.preventDefault();
  if (!createOrderForm) return;
  if (createOrderForm.dataset.disabled === 'true' || isOrderCreatePanelHidden()) {
    return;
  }
  const newOrderNumber = document.getElementById('newOrderNumber').value.trim();
  const selectedCustomerId = Number(orderCustomerSelect.value);
  const newCustomerName = document.getElementById('newCustomerName').value.trim();
  const newCustomerDocument = document.getElementById('newCustomerDocument').value.trim();
  const newCustomerContact = document.getElementById('newCustomerContact').value.trim();
  const newOrderStatus = document.getElementById('newOrderStatus').value;
  const newOrderDeliveryDateRaw = newOrderDeliveryDateInput?.value || '';
  const newOrderDeliveryDate = normalizeDateForApi(newOrderDeliveryDateRaw);
  const newOrderNotes = document.getElementById('newOrderNotes').value.trim();
  const assignedTailorId = assignTailorSelect.value ? Number(assignTailorSelect.value) : null;
  const assignedVendorId = assignVendorSelect?.value ? Number(assignVendorSelect.value) : null;
  const invoiceNumber = newOrderInvoiceInput?.value.trim() || '';
  const originBranch = newOrderOriginSelect?.value || '';
  const measurements = collectMeasurements();
  const { tasks: orderTasks, firstInput: firstTaskInput } = collectNewOrderTasks();


  if (!selectedCustomerId) {
    showToast('Selecciona un cliente para registrar la orden.', 'error');
    return;
  }

  if (!originBranch) {
    showToast('Selecciona el establecimiento remitente.', 'error');
    return;
  }

  if (!orderTasks.length) {
    showToast('Agrega al menos un trabajo para la orden.', 'error');
    if (firstTaskInput) {
      firstTaskInput.focus();
    }
    return;
  }

  const submitButton = createOrderForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
  }
  let orderCreatedSuccessfully = false;
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
        assigned_vendor_id: assignedVendorId,
        delivery_date: newOrderDeliveryDate ? newOrderDeliveryDate : null,
        invoice_number: invoiceNumber || null,
        origin_branch: originBranch,
        tasks: orderTasks,
      },
    });
    orderCreatedSuccessfully = true;
    delete state.customerOrdersCache[String(selectedCustomerId)];
    delete state.customerDisplayCache[String(selectedCustomerId)];
    await loadOrders();
    await loadCustomers();
    resetCreateOrderForm();
    showToast('Orden creada correctamente.', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    if (orderCreatedSuccessfully) {
      markKanbanDataStale();
    }
    syncCreateOrderFormDisabled();
  }
}

if (createOrderForm) {
  createOrderForm.addEventListener('submit', createOrder);
}

function handleOrderCustomerChange() {
  const selectedId = Number(orderCustomerSelect.value);
  const customer = (state.customerOptions || []).find((item) => item.id === selectedId);
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
ensureNewOrderTaskRow();

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

function formatDateForApi(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDateForApi(value) {
  if (!value) {
    return '';
  }
  if (value instanceof Date) {
    return formatDateForApi(value);
  }
  if (typeof value === 'number') {
    return formatDateForApi(new Date(value));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }
    const parsed = parseDateValue(trimmed);
    if (parsed) {
      return formatDateForApi(parsed);
    }
  }
  return '';
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


function matchesKanbanSearch(order, normalizedSearch) {
  if (!normalizedSearch) {
    return true;
  }
  const searchableValues = [
    order?.order_number,
    order?.customer_name,
    order?.customer_document,
    order?.customer_contact,
    order?.invoice_number,
    order?.assigned_tailor?.full_name,
    order?.assigned_vendor?.full_name,
  ];
  return searchableValues.some((value) => {
    if (!value) return false;
    return normalizeText(value).includes(normalizedSearch);
  });
}

function createKanbanMetaItem(label, value) {
  const item = document.createElement('div');
  item.className = 'kanban-card-meta-item';
  const labelElement = document.createElement('span');
  labelElement.className = 'kanban-card-meta-label';
  labelElement.textContent = `${label}:`;
  const valueElement = document.createElement('span');
  valueElement.className = 'kanban-card-meta-value';
  valueElement.textContent = value || '—';
  item.appendChild(labelElement);
  item.appendChild(valueElement);
  return item;
}

function getOrderDetailUrl(order) {
  if (!order || order.id === undefined || order.id === null) {
    return null;
  }
  if (typeof window === 'undefined' || typeof window.location === 'undefined') {
    return `order.html?id=${encodeURIComponent(order.id)}`;
  }
  try {
    const detailUrl = new URL('order.html', window.location.href);
    detailUrl.searchParams.set('id', order.id);
    if (order?.order_number) {
      detailUrl.searchParams.set('number', order.order_number);
    }
    return detailUrl.toString();
  } catch (error) {
    let fallback = `order.html?id=${encodeURIComponent(order.id)}`;
    if (order?.order_number) {
      fallback += `&number=${encodeURIComponent(order.order_number)}`;
    }
    return fallback;
  }
}

function createKanbanCard(order) {
  const detailUrl = getOrderDetailUrl(order);
  const card = detailUrl ? document.createElement('a') : document.createElement('article');
  card.className = 'kanban-card';
  if (order?.id !== undefined && order?.id !== null) {
    card.dataset.orderId = String(order.id);
  }
  if (detailUrl) {
    card.href = detailUrl;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.classList.add('is-clickable');
    const labelParts = [];
    if (order?.order_number) {
      labelParts.push(`Orden ${order.order_number}`);
    }
    if (order?.customer_name) {
      labelParts.push(order.customer_name);
    }
    card.setAttribute('aria-label', `Abrir detalle de ${labelParts.join(' · ') || 'la orden'}`);
    card.title = 'Abrir información de la orden en una nueva pestaña';
  }


  const header = document.createElement('div');
  header.className = 'kanban-card-header';
  const orderNumber = document.createElement('span');
  orderNumber.className = 'kanban-card-order';
  orderNumber.textContent = order?.order_number || 'Sin número';
  header.appendChild(orderNumber);
  if (order?.status) {
    header.appendChild(createStatusBadge(order.status));
  }
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'kanban-card-body';
  body.appendChild(createKanbanMetaItem('Cliente', order?.customer_name || '—'));
  if (order?.customer_document) {
    body.appendChild(createKanbanMetaItem('Documento', order.customer_document));
  }
  if (order?.assigned_tailor?.full_name) {
    body.appendChild(createKanbanMetaItem('Sastre', order.assigned_tailor.full_name));
  }
  if (order?.assigned_vendor?.full_name) {
    body.appendChild(createKanbanMetaItem('Vendedor', order.assigned_vendor.full_name));
  }
  card.appendChild(body);

  const footer = document.createElement('div');
  footer.className = 'kanban-card-footer';
  const delivery = document.createElement('span');
  delivery.className = 'kanban-card-delivery';
  if (order?.delivery_date) {
    delivery.textContent = formatDeliveryDateDisplay(order);
    if (isDeliveryDateOverdue(order.delivery_date, order.status)) {
      delivery.classList.add('overdue');
    } else if (isDeliveryDateClose(order.delivery_date, order.status)) {
      delivery.classList.add('due-soon');
    }
  } else {
    delivery.textContent = 'Sin fecha de entrega';
  }
  footer.appendChild(delivery);

  if (order?.updated_at) {
    const updated = document.createElement('span');
    updated.className = 'kanban-card-updated';
    const time = document.createElement('time');
    time.dateTime = order.updated_at;
    time.textContent = formatDate(order.updated_at);
    updated.textContent = 'Actualizado:';
    updated.appendChild(document.createTextNode(' '));
    updated.appendChild(time);
    footer.appendChild(updated);
  }

  card.appendChild(footer);
  return card;
}

function renderOrderKanban() {
  if (!orderKanbanColumns) {
    return;
  }

  if (orderKanbanSearchInput && orderKanbanSearchInput.value !== state.kanbanSearchTerm) {
    orderKanbanSearchInput.value = state.kanbanSearchTerm;
  }

  orderKanbanColumns.innerHTML = '';
  if (orderKanbanStatus) {
    orderKanbanStatus.textContent = '';
    orderKanbanStatus.classList.add('hidden');
  }

  if (!state.token) {
    if (orderKanbanStatus) {
      orderKanbanStatus.textContent = 'Inicia sesión para ver el tablero de órdenes.';
      orderKanbanStatus.classList.remove('hidden');
    }
    return;
  }

  if (state.kanbanLoading) {
    if (orderKanbanStatus) {
      orderKanbanStatus.textContent = 'Cargando tablero Kanban...';
      orderKanbanStatus.classList.remove('hidden');
    }
    return;
  }

  if (state.kanbanError) {
    if (orderKanbanStatus) {
      orderKanbanStatus.textContent = state.kanbanError;
      orderKanbanStatus.classList.remove('hidden');
    }
    return;
  }

  const orders = Array.isArray(state.kanbanOrders) ? state.kanbanOrders : [];
  if (!orders.length) {
    if (orderKanbanStatus) {
      orderKanbanStatus.textContent = state.kanbanNeedsRefresh
        ? 'Carga el tablero para ver las órdenes registradas.'
        : 'No hay órdenes registradas.';
      orderKanbanStatus.classList.remove('hidden');
    }
    return;
  }

  const normalizedSearch = normalizeText(state.kanbanSearchTerm);
  const filteredOrders = normalizedSearch
    ? orders.filter((order) => matchesKanbanSearch(order, normalizedSearch))
    : orders;

  if (!filteredOrders.length) {
    if (orderKanbanStatus) {
      orderKanbanStatus.textContent = 'No se encontraron órdenes que coincidan con la búsqueda actual.';
      orderKanbanStatus.classList.remove('hidden');
    }
    return;
  }

  const orderedStatuses = [];
  const seenStatuses = new Set();

  const appendStatus = (status) => {
    const label = status && status.toString().trim() ? status : KANBAN_FALLBACK_STATUS;
    if (!seenStatuses.has(label)) {
      seenStatuses.add(label);
      orderedStatuses.push(label);
    }
  };

  if (Array.isArray(state.statuses) && state.statuses.length) {
    state.statuses.forEach(appendStatus);
  }
  filteredOrders.forEach((order) => appendStatus(order?.status));

  if (!seenStatuses.size) {
    orderedStatuses.push(KANBAN_FALLBACK_STATUS);
  }

  const groupedByStatus = new Map();
  orderedStatuses.forEach((status) => {
    groupedByStatus.set(status, []);
  });

  filteredOrders.forEach((order) => {
    const label = order?.status && order.status.toString().trim()
      ? order.status
      : KANBAN_FALLBACK_STATUS;
    if (!groupedByStatus.has(label)) {
      groupedByStatus.set(label, []);
      orderedStatuses.push(label);
    }
    groupedByStatus.get(label).push(order);
  });

  orderedStatuses.forEach((status) => {
    const column = document.createElement('section');
    column.className = 'kanban-column';
    column.dataset.status = status || KANBAN_FALLBACK_STATUS;

    const header = document.createElement('div');
    header.className = 'kanban-column-header';
    const title = document.createElement('h4');
    title.className = 'kanban-column-title';
    title.textContent = status || KANBAN_FALLBACK_STATUS;
    header.appendChild(title);

    const count = document.createElement('span');
    count.className = 'kanban-column-count';
    const ordersForStatus = groupedByStatus.get(status) || [];
    count.textContent = String(ordersForStatus.length);
    header.appendChild(count);

    column.appendChild(header);

    const body = document.createElement('div');
    body.className = 'kanban-column-body';

    if (!ordersForStatus.length) {
      body.classList.add('is-empty');
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'Sin órdenes en este estado.';
      body.appendChild(emptyMessage);
    } else {
      ordersForStatus.sort(compareOrdersForDisplay).forEach((order) => {
        body.appendChild(createKanbanCard(order));
      });
    }

    column.appendChild(body);
    orderKanbanColumns.appendChild(column);
  });

  if (orderKanbanStatus) {
    const messages = [];
    if (state.kanbanNeedsRefresh) {
      messages.push('El tablero contiene información en caché. Actualízalo para ver los últimos cambios.');
    }
    if (state.kanbanLastUpdated) {
      messages.push(`Última actualización: ${formatDate(state.kanbanLastUpdated)}.`);
    }
    if (messages.length) {
      orderKanbanStatus.textContent = messages.join(' ');
      orderKanbanStatus.classList.remove('hidden');
    } else {
      orderKanbanStatus.classList.add('hidden');
    }
  }
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

  const totalItems =
    typeof state.orderTotal === 'number' ? state.orderTotal : state.orders.length;

  const normalizedPage =
    updatePaginationControls({
      infoElement: orderPaginationInfo,
      prevButton: orderPrevPageButton,
      nextButton: orderNextPageButton,
      pageSizeSelect: orderPageSizeSelect,
      currentPage: state.orderPage || 1,
      totalItems,
      pageSize,
      emptyLabel: 'órdenes',
    }) || (state.orderPage || 1);

  if (state.orderPage !== normalizedPage) {
    state.orderPage = normalizedPage;
  }

  if (!state.orders.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = ORDER_TABLE_COLUMN_COUNT;
    const hasSearch = Boolean(state.orderSearchTerm.trim());
    cell.textContent = totalItems === 0
      ? hasSearch
        ? 'No se encontraron órdenes que coincidan con la búsqueda.'
        : 'No hay órdenes registradas todavía.'
      : 'No hay órdenes para la página seleccionada.';
    cell.className = 'muted';
    row.appendChild(cell);
    ordersTableBody.appendChild(row);
    clearOrderDetail({ skipRender: true });
    return;
  }

  if (
    state.selectedOrderId !== null &&
    state.orders.every((order) => order.id !== state.selectedOrderId)
  ) {
    clearOrderDetail({ skipRender: true });
  }

  const sortedOrders = [...state.orders].sort(compareOrdersForDisplay);

  let hasActiveDetail = false;

  sortedOrders.forEach((order) => {
    const row = document.createElement('tr');
    row.classList.add('order-row');
    row.dataset.orderId = String(order.id);

    const isSelected = state.selectedOrderId === order.id;
    if (isSelected) {
      row.classList.add('is-selected');
    }

    const orderCell = document.createElement('td');
    orderCell.dataset.label = 'Orden';
    orderCell.innerHTML = `<strong>${order.order_number}</strong>`;

    const customerCell = document.createElement('td');
    customerCell.dataset.label = 'Cliente';
    customerCell.textContent = order.customer_name || '—';

    const statusCell = document.createElement('td');
    statusCell.dataset.label = 'Estado';
    statusCell.appendChild(createStatusBadge(order.status));

    const createdCell = document.createElement('td');
    createdCell.dataset.label = 'Fecha de ingreso';
    createdCell.textContent = formatDate(order.created_at);

    const deliveryCell = document.createElement('td');
    deliveryCell.dataset.label = 'Fecha de entrega';
    if (order.delivery_date) {
      deliveryCell.textContent = formatDeliveryDateDisplay(order);
      if (isDeliveryDateOverdue(order.delivery_date, order.status)) {
        deliveryCell.classList.add('overdue');
      } else if (isDeliveryDateClose(order.delivery_date, order.status)) {
        deliveryCell.classList.add('due-soon');
      }
    } else {
      deliveryCell.innerHTML = '<span class="muted">Sin definir</span>';
    }

    const actionsCell = document.createElement('td');
    actionsCell.dataset.label = 'Acciones';
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


function renderUsers() {
  if (!usersTableBody) return;
  usersTableBody.innerHTML = '';

  const appendMessageRow = (message) => {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.className = 'muted';
    cell.textContent = message;
    row.appendChild(cell);
    usersTableBody.appendChild(row);
  };

  if (!state.user || state.user.role !== 'administrador') {
    appendMessageRow('Inicia sesión como administrador para ver los usuarios.');
    updateUserEditForm();
    return;
  }

  if (state.usersLoadError) {
    appendMessageRow(state.usersLoadError);
    updateUserEditForm();
    return;
  }

  if (!state.usersLoaded) {
    appendMessageRow('Cargando usuarios...');
    updateUserEditForm();
    return;
  }

  if (!state.users.length) {
    appendMessageRow('No hay usuarios registrados.');
    updateUserEditForm();
    return;
  }

  state.users.forEach((user) => {
    const row = document.createElement('tr');
    row.classList.add('user-row');
    const isEditing = state.editingUserId === user.id;
    if (isEditing) {
      row.classList.add('is-editing');
    }

    const usernameCell = document.createElement('td');
    usernameCell.dataset.label = 'Usuario';
    usernameCell.textContent = user.username;

    const nameCell = document.createElement('td');
    nameCell.dataset.label = 'Nombre completo';
    nameCell.textContent = user.full_name;

    const roleCell = document.createElement('td');
    roleCell.dataset.label = 'Rol';
    roleCell.textContent = ROLE_LABELS[user.role] || user.role;

    const actionsCell = document.createElement('td');
    actionsCell.dataset.label = 'Acciones';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary';
    editButton.textContent = isEditing ? 'Cerrar formulario' : 'Editar';
    editButton.addEventListener('click', () => {
      if (state.editingUserId === user.id) {
        cancelUserEdit();
      } else {
        startUserEdit(user.id);
      }
    });
    actionsCell.appendChild(editButton);

    row.appendChild(usernameCell);
    row.appendChild(nameCell);
    row.appendChild(roleCell);
    row.appendChild(actionsCell);

    usersTableBody.appendChild(row);
  });

  updateUserEditForm();
}

function populateUserRoleSelect(selectElement, selectedValue = DEFAULT_NEW_USER_ROLE) {
  if (!selectElement) return;
  const normalized = (selectedValue || '').trim();
  const fallbackIndex = Math.max(
    USER_ROLE_OPTIONS.findIndex((option) => option.value === DEFAULT_NEW_USER_ROLE),
    0,
  );
  let selectedIndex = -1;
  selectElement.innerHTML = '';
  USER_ROLE_OPTIONS.forEach(({ value, label }, index) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (normalized === value) {
      option.selected = true;
      selectedIndex = index;
    }
    selectElement.appendChild(option);
  });
  if (selectedIndex === -1) {
    selectElement.selectedIndex = fallbackIndex;
  }
}

function resetCreateUserForm() {
  if (newUserUsernameInput) {
    newUserUsernameInput.value = '';
  }
  if (newUserFullNameInput) {
    newUserFullNameInput.value = '';
  }
  if (newUserPasswordInput) {
    newUserPasswordInput.value = '';
  }
  populateUserRoleSelect(newUserRoleSelect, DEFAULT_NEW_USER_ROLE);
}

function setCreateUserVisible(visible) {
  const isAdmin = state.user?.role === 'administrador';
  const shouldShow = Boolean(visible) && isAdmin;
  state.isCreateUserVisible = shouldShow;
  updateUserCreationForm();
  if (shouldShow) {
    if (userCreateContainer && typeof userCreateContainer.scrollIntoView === 'function') {
      userCreateContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const firstField = createUserForm?.querySelector('input, select, textarea');
    firstField?.focus();
  } else if (isAdmin) {
    resetCreateUserForm();
  }
}

function populateUserEditForm(user) {
  if (!user || state.user?.role !== 'administrador') {
    clearUserEditForm();
    return;
  }
  if (editUserUsernameInput) {
    editUserUsernameInput.value = user.username || '';
  }
  if (editUserFullNameInput) {
    editUserFullNameInput.value = user.full_name || '';
  }
  populateUserRoleSelect(editUserRoleSelect, user.role || DEFAULT_NEW_USER_ROLE);
  if (editUserPasswordInput) {
    editUserPasswordInput.value = '';
  }
  if (editUserTitle) {
    const displayName = (user.full_name || '').trim() || user.username || 'Editar usuario';
    editUserTitle.textContent = `Editar usuario: ${displayName}`;
  }
  if (userEditContainer) {
    userEditContainer.classList.remove('hidden');
    userEditContainer.setAttribute('aria-hidden', 'false');
  }
}

function clearUserEditForm() {
  if (editUserUsernameInput) {
    editUserUsernameInput.value = '';
  }
  if (editUserFullNameInput) {
    editUserFullNameInput.value = '';
  }
  if (editUserPasswordInput) {
    editUserPasswordInput.value = '';
  }
  populateUserRoleSelect(editUserRoleSelect, DEFAULT_NEW_USER_ROLE);
  if (editUserTitle) {
    editUserTitle.textContent = 'Editar usuario';
  }
  if (userEditContainer) {
    userEditContainer.classList.add('hidden');
    userEditContainer.setAttribute('aria-hidden', 'true');
  }
}

function updateUserEditForm() {
  const isAdmin = state.user?.role === 'administrador';
  if (!isAdmin) {
    state.editingUserId = null;
    clearUserEditForm();
    return;
  }
  const editingId = state.editingUserId;
  if (!editingId) {
    clearUserEditForm();
    return;
  }
  const editingUser = state.users.find((user) => user.id === editingId);
  if (!editingUser) {
    state.editingUserId = null;
    clearUserEditForm();
    return;
  }
  const currentUsername = editUserUsernameInput?.value || '';
  if (!currentUsername || currentUsername !== (editingUser.username || '')) {
    populateUserEditForm(editingUser);
  } else {
    if (editUserTitle) {
      const displayName = (editingUser.full_name || '').trim() || editingUser.username || 'Editar usuario';
      editUserTitle.textContent = `Editar usuario: ${displayName}`;
    }
    if (userEditContainer) {
      userEditContainer.classList.remove('hidden');
      userEditContainer.setAttribute('aria-hidden', 'false');
    }
  }
}

function startUserEdit(userId) {
  if (!state.user || state.user.role !== 'administrador') {
    showToast('Solo los administradores pueden editar usuarios.', 'error');
    return;
  }
  const numericId = Number(userId);
  if (!Number.isFinite(numericId)) {
    showToast('Selecciona un usuario válido para editar.', 'error');
    return;
  }
  const user = state.users.find((entry) => entry.id === numericId);
  if (!user) {
    showToast('No se encontró el usuario seleccionado.', 'error');
    return;
  }
  state.editingUserId = numericId;
  populateUserEditForm(user);
  renderUsers();
  if (editUserFullNameInput) {
    editUserFullNameInput.focus();
    editUserFullNameInput.select?.();
  }
}

function cancelUserEdit({ focusTable = false } = {}) {
  state.editingUserId = null;
  clearUserEditForm();
  renderUsers();
  if (focusTable && usersTableBody) {
    const firstButton = usersTableBody.querySelector('button');
    firstButton?.focus();
  }
}

function updateUserCreationForm() {
  const isAdmin = state.user?.role === 'administrador';
  if (!isAdmin && state.isCreateUserVisible) {
    state.isCreateUserVisible = false;
  }
  const shouldShow = isAdmin && state.isCreateUserVisible;
  if (userCreateContainer) {
    userCreateContainer.classList.toggle('hidden', !shouldShow);
    userCreateContainer.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  }
  if (toggleCreateUserButton) {
    toggleCreateUserButton.classList.toggle('hidden', !isAdmin);
    toggleCreateUserButton.disabled = !isAdmin;
    toggleCreateUserButton.setAttribute('aria-expanded', shouldShow ? 'true' : 'false');
    toggleCreateUserButton.textContent = shouldShow ? 'Ocultar formulario' : 'Registrar usuario';
  }
  if (createUserForm) {
    const elements = createUserForm.querySelectorAll('input, select, button, textarea');
    elements.forEach((element) => {
      if (element.tagName === 'BUTTON') {
        const isLoading = element.dataset.loading === 'true';
        element.disabled = !isAdmin || isLoading;
      } else {
        element.disabled = !isAdmin;
      }
    });
  }
  if (!isAdmin) {
    resetCreateUserForm();
  }
}

async function handleCreateUser(event) {
  event.preventDefault();
  if (!state.user || state.user.role !== 'administrador') {
    showToast('Solo los administradores pueden crear usuarios.', 'error');
    return;
  }
  const username = newUserUsernameInput?.value?.trim() || '';
  if (!username) {
    showToast('Ingresa un nombre de usuario.', 'error');
    if (newUserUsernameInput) {
      newUserUsernameInput.focus();
    }
    return;
  }
  const fullName = newUserFullNameInput?.value?.trim() || '';
  if (!fullName) {
    showToast('Ingresa el nombre completo.', 'error');
    if (newUserFullNameInput) {
      newUserFullNameInput.focus();
    }
    return;
  }
  const passwordRaw = newUserPasswordInput?.value || '';
  const password = passwordRaw.trim();
  if (!password) {
    showToast('Ingresa una contraseña temporal.', 'error');
    if (newUserPasswordInput) {
      newUserPasswordInput.focus();
    }
    return;
  }
  const selectedRole = newUserRoleSelect?.value || DEFAULT_NEW_USER_ROLE;
  const role = USER_ROLE_OPTIONS.some((option) => option.value === selectedRole)
    ? selectedRole
    : DEFAULT_NEW_USER_ROLE;
  const submitButton = createUserForm?.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.dataset.loading = 'true';
  }
  try {
    await apiFetch('/users', {
      method: 'POST',
      body: {
        username,
        full_name: fullName,
        password,
        role,
      },
    });
    showToast('Usuario creado correctamente.', 'success');
    resetCreateUserForm();
    if (newUserUsernameInput) {
      newUserUsernameInput.focus();
    }
    await loadUsers();
    if (role === 'sastre') {
      await loadTailors();
    } else if (role === 'vendedor') {
      await loadVendors();
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    if (submitButton) {
      delete submitButton.dataset.loading;
      submitButton.disabled = state.user?.role !== 'administrador';
    }
    updateUserCreationForm();
  }
}

async function handleEditUserSubmit(event) {
  event.preventDefault();
  if (!state.user || state.user.role !== 'administrador') {
    showToast('Solo los administradores pueden editar usuarios.', 'error');
    return;
  }
  const editingId = state.editingUserId;
  if (!editingId) {
    showToast('Selecciona un usuario para editar.', 'error');
    return;
  }
  const editingUser = state.users.find((user) => user.id === editingId);
  if (!editingUser) {
    showToast('El usuario seleccionado ya no está disponible.', 'error');
    cancelUserEdit();
    return;
  }
  const fullName = editUserFullNameInput?.value?.trim() || '';
  if (!fullName) {
    showToast('Ingresa el nombre completo.', 'error');
    editUserFullNameInput?.focus();
    return;
  }
  const selectedRole = editUserRoleSelect?.value || editingUser.role;
  const normalizedRole = USER_ROLE_OPTIONS.some((option) => option.value === selectedRole)
    ? selectedRole
    : editingUser.role;
  const passwordRaw = editUserPasswordInput?.value || '';
  const password = passwordRaw.trim();
  const payload = {};
  if (fullName !== (editingUser.full_name || '')) {
    payload.full_name = fullName;
  }
  if (normalizedRole && normalizedRole !== editingUser.role) {
    payload.role = normalizedRole;
  }
  if (password) {
    payload.password = password;
  }
  if (!Object.keys(payload).length) {
    showToast('No hay cambios para guardar.', 'info');
    return;
  }
  const submitButton = editUserForm?.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.dataset.loading = 'true';
  }
  const previousRole = editingUser.role;
  try {
    await apiFetch(`/users/${editingUser.id}`, {
      method: 'PATCH',
      body: payload,
    });
    showToast('Usuario actualizado correctamente.', 'success');
    cancelUserEdit({ focusTable: false });
    await loadUsers();
    const updatedUser = state.users.find((user) => user.id === editingUser.id);
    const updatedRole = updatedUser?.role || payload.role || previousRole;
    if (previousRole !== updatedRole) {
      if (previousRole === 'sastre' || updatedRole === 'sastre') {
        await loadTailors();
      }
      if (previousRole === 'vendedor' || updatedRole === 'vendedor') {
        await loadVendors();
      }
    }
  } catch (error) {
    showToast(error.message, 'error');
    updateUserEditForm();
  } finally {
    if (submitButton) {
      delete submitButton.dataset.loading;
      submitButton.disabled = state.user?.role !== 'administrador';
    }
    if (editUserPasswordInput) {
      editUserPasswordInput.value = '';
    }
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
    dateCell.dataset.label = 'Fecha';

    const actorCell = document.createElement('td');
    actorCell.textContent = entry.actor ? entry.actor.full_name : 'Sistema';
    actorCell.dataset.label = 'Usuario';

    const actionCell = document.createElement('td');
    actionCell.textContent = entry.action;
    actionCell.dataset.label = 'Acción';

    const entityCell = document.createElement('td');
    entityCell.textContent = entry.entity_id ? `${entry.entity_type} (#${entry.entity_id})` : entry.entity_type;
    entityCell.dataset.label = 'Entidad';

    const beforeCell = document.createElement('td');
    beforeCell.dataset.label = 'Antes';
    if (entry.before && Object.keys(entry.before).length) {
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(entry.before, null, 2);
      beforeCell.appendChild(pre);
    } else {
      beforeCell.innerHTML = '<span class="muted">Sin datos</span>';
    }

    const afterCell = document.createElement('td');
    afterCell.dataset.label = 'Después';
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

async function restoreSessionFromStorage() {
  const storedToken = readStoredToken();
  if (!storedToken) {
    updateNavigationForAuth();
    return;
  }

  state.token = storedToken;
  updateNavigationForAuth();

  try {
    await bootstrapAuthenticatedSession();
  } catch (error) {
    clearStoredToken();
    if (state.token) {
      handleLogout(false);
      showToast('No se pudo restaurar la sesión. Inicia sesión nuevamente.', 'error');
    }
  } finally {
    updateNavigationForAuth();
  }
}

function initialise() {
  ensureMeasurementRow();
  if (customerMeasurementsContainer && !customerMeasurementsContainer.children.length) {
    createMeasurementSetBlock(customerMeasurementsContainer);
  }
  resetCreateUserForm();
  updateUserCreationForm();
}

initialise();
restoreSessionFromStorage();
