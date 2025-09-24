const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000';
const TOKEN_STORAGE_KEY = 'sastreria.authToken';
const ORDER_TASK_STATUS_PENDING = 'pendiente';
const ORDER_TASK_STATUS_COMPLETED = 'completado';
const ESTABLISHMENTS = ['Urdesa', 'Batan', 'Indie'];

const headingNumberElement = document.getElementById('orderHeadingNumber');
const headingCreatedElement = document.getElementById('orderHeadingCreated');
const headingUpdatedElement = document.getElementById('orderHeadingUpdated');
const headingStatusElement = document.getElementById('orderHeadingStatus');
const statusMessageElement = document.getElementById('orderDetailStatusMessage');
const contentElement = document.getElementById('orderDetailContent');
const summaryCustomerElement = document.getElementById('orderSummaryCustomer');
const summaryDocumentElement = document.getElementById('orderSummaryDocument');
const summaryContactElement = document.getElementById('orderSummaryContact');
const summaryInvoiceElement = document.getElementById('orderSummaryInvoice');
const summaryOriginElement = document.getElementById('orderSummaryOrigin');
const summaryDeliveryElement = document.getElementById('orderSummaryDelivery');
const summaryTailorElement = document.getElementById('orderSummaryTailor');
const summaryVendorElement = document.getElementById('orderSummaryVendor');
const notesElement = document.getElementById('orderDetailNotes');
const measurementsElement = document.getElementById('orderDetailMeasurements');
const tasksContainerElement = document.getElementById('orderDetailTasks');
const currentYearElement = document.getElementById('currentYear');
const orderEditFormElement = document.getElementById('orderEditForm');
const orderEditContactInput = document.getElementById('orderEditContact');
const orderEditInvoiceInput = document.getElementById('orderEditInvoice');
const orderEditStatusSelect = document.getElementById('orderEditStatus');
const orderEditTailorSelect = document.getElementById('orderEditTailor');
const orderEditVendorSelect = document.getElementById('orderEditVendor');
const orderEditOriginSelect = document.getElementById('orderEditOrigin');
const orderEditDeliveryInput = document.getElementById('orderEditDelivery');
const orderEditNotesTextarea = document.getElementById('orderEditNotes');
const orderEditFeedbackElement = document.getElementById('orderEditFeedback');
const orderEditPermissionsNotice = document.getElementById('orderEditPermissionsNotice');

const detailState = {
  orderId: null,
  token: null,
  order: null,
  user: null,
  statuses: [],
  tailors: [],
  vendors: [],
  editingAllowed: false,
  catalogWarnings: [],
};

function setCurrentYear() {
  if (currentYearElement) {
    currentYearElement.textContent = String(new Date().getFullYear());
  }
}

function readStoredToken() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (typeof storedToken !== 'string') {
      return null;
    }
    const trimmed = storedToken.trim();
    return trimmed ? trimmed : null;
  } catch (error) {
    return null;
  }
}

function parseOrderId() {
  if (typeof window === 'undefined') {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('id');
  if (!rawId) {
    return null;
  }
  const numericId = Number(rawId);
  return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
}

function applyInitialOrderNumberFromQuery() {
  if (typeof window === 'undefined' || !headingNumberElement) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get('number');
  if (orderNumber) {
    headingNumberElement.textContent = orderNumber;
    document.title = `Orden ${orderNumber} | Portal de Sastrería`;
  }
}

function setStatusMessage(message, type = 'info') {
  if (!statusMessageElement) {
    return;
  }
  const normalizedMessage = message ? message.toString().trim() : '';
  statusMessageElement.classList.remove('loading', 'error', 'success');
  if (!normalizedMessage) {
    statusMessageElement.textContent = '';
    statusMessageElement.classList.add('hidden');
    return;
  }
  statusMessageElement.textContent = normalizedMessage;
  statusMessageElement.classList.remove('hidden');
  if (type === 'loading') {
    statusMessageElement.classList.add('loading');
  } else if (type === 'error') {
    statusMessageElement.classList.add('error');
  } else if (type === 'success') {
    statusMessageElement.classList.add('success');
  }
}

function clearStatusMessage() {
  setStatusMessage('');
}

function showContent() {
  if (contentElement) {
    contentElement.classList.remove('hidden');
  }
}

function hideContent() {
  if (contentElement) {
    contentElement.classList.add('hidden');
  }
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleString('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    return dateString || '';
  }
}

function formatDateOnly(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('es-EC', {
      dateStyle: 'medium',
    });
  } catch (error) {
    return dateString || '';
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
  if (typeof value === 'number') {
    return formatDateTimeForInput(new Date(value));
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
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateTimeForInput(parsed);
    }
  }
  return '';
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
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateForApi(parsed);
    }
  }
  return '';
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

function isOrderDelivered(status) {
  return typeof status === 'string' && status.trim().toLowerCase() === 'entregado';
}

function formatDeliveryDateLabel(order) {
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

function createStatusBadgeElement(status) {
  const badge = document.createElement('span');
  badge.className = 'status-badge';
  const text = status && status.toString().trim() ? status : 'Sin estado';
  badge.textContent = text;
  badge.classList.add(`status-${getStatusBadgeVariant(status)}`);
  return badge;
}

function createTaskStatusBadge(status) {
  const badge = document.createElement('span');
  badge.className = 'status-badge';
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (normalized === ORDER_TASK_STATUS_COMPLETED) {
    badge.textContent = 'Completado';
    badge.classList.add('status-success');
  } else {
    badge.textContent = 'Pendiente';
    badge.classList.add('status-warning');
  }
  return badge;
}

function setSummaryField(element, value, fallback = '—') {
  if (!element) {
    return;
  }
  const normalized = value === null || value === undefined
    ? ''
    : value.toString().trim();
  if (normalized) {
    element.textContent = normalized;
    element.classList.remove('muted');
  } else {
    element.textContent = fallback;
    element.classList.add('muted');
  }
}

function renderNotes(notes) {
  if (!notesElement) return;
  const normalized = typeof notes === 'string' ? notes.trim() : '';
  if (normalized) {
    notesElement.textContent = normalized;
    notesElement.classList.remove('muted');
  } else {
    notesElement.textContent = 'Sin notas registradas.';
    notesElement.classList.add('muted');
  }
}

function renderMeasurements(measurements) {
  if (!measurementsElement) return;
  measurementsElement.innerHTML = '';
  measurementsElement.classList.remove('muted');
  if (!Array.isArray(measurements) || !measurements.length) {
    measurementsElement.textContent = 'Sin medidas registradas.';
    measurementsElement.classList.add('muted');
    return;
  }
  measurements.forEach((measurement) => {
    if (!measurement) return;
    const nameValue = measurement.nombre;
    const valueValue = measurement.valor;
    const name =
      typeof nameValue === 'string'
        ? nameValue.trim()
        : nameValue !== null && nameValue !== undefined
          ? nameValue.toString().trim()
          : '';
    const value =
      typeof valueValue === 'string'
        ? valueValue.trim()
        : valueValue !== null && valueValue !== undefined
          ? valueValue.toString().trim()
          : '';
    if (!name && !value) {
      return;
    }
    const tag = document.createElement('span');
    tag.className = 'tag';
    const label = name && value ? `${name}: ${value}` : name || value;
    tag.textContent = label;
    measurementsElement.appendChild(tag);
  });
  if (!measurementsElement.children.length) {
    measurementsElement.textContent = 'Sin medidas registradas.';
    measurementsElement.classList.add('muted');
  }
}

function parseSelectNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function getTrimmedOrNull(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function addCatalogWarning(message) {
  const normalized = message ? message.toString().trim() : '';
  if (!normalized) {
    return;
  }
  if (!detailState.catalogWarnings.includes(normalized)) {
    detailState.catalogWarnings.push(normalized);
  }
}

function canEditOrder() {
  const role = detailState.user?.role;
  if (!role) {
    return false;
  }
  const normalized = role.toString().trim().toLowerCase();
  return normalized === 'administrador' || normalized === 'vendedor';
}

function updateEditPermissions() {
  const allowed = canEditOrder();
  detailState.editingAllowed = allowed;
  if (orderEditPermissionsNotice) {
    if (allowed) {
      orderEditPermissionsNotice.classList.add('hidden');
      orderEditPermissionsNotice.textContent = '';
    } else {
      orderEditPermissionsNotice.textContent =
        'Tu rol no permite modificar la orden desde esta vista.';
      orderEditPermissionsNotice.classList.remove('hidden');
    }
  }
  if (orderEditFormElement) {
    if (!allowed) {
      orderEditFormElement.classList.add('hidden');
      orderEditFormElement.classList.remove('is-disabled');
    }
  }
  if (!allowed && orderEditFeedbackElement) {
    orderEditFeedbackElement.textContent = '';
    orderEditFeedbackElement.classList.add('hidden');
    orderEditFeedbackElement.classList.remove('is-success', 'is-error', 'is-warning');
  }
}

function setEditFormDisabled(disabled) {
  if (!detailState.editingAllowed || !orderEditFormElement) {
    return;
  }
  orderEditFormElement.classList.toggle('is-disabled', disabled);
  const controls = orderEditFormElement.querySelectorAll('input, select, textarea, button');
  controls.forEach((control) => {
    control.disabled = disabled;
  });
}

function populateStatusOptions(selectedValue) {
  if (!orderEditStatusSelect) {
    return;
  }
  const normalizedSelected = selectedValue ? selectedValue.toString() : '';
  orderEditStatusSelect.innerHTML = '';
  let hasSelected = false;
  const statuses = Array.isArray(detailState.statuses) ? detailState.statuses : [];
  statuses.forEach((status) => {
    const label = status ? status.toString().trim() : '';
    if (!label) {
      return;
    }
    const option = document.createElement('option');
    option.value = label;
    option.textContent = label;
    if (normalizedSelected && label === normalizedSelected) {
      option.selected = true;
      hasSelected = true;
    }
    orderEditStatusSelect.appendChild(option);
  });
  if (normalizedSelected && !hasSelected) {
    const fallback = document.createElement('option');
    fallback.value = normalizedSelected;
    fallback.textContent = normalizedSelected;
    fallback.selected = true;
    orderEditStatusSelect.appendChild(fallback);
  }
}

function populateTailorOptions(selectedId, selectedLabel = '') {
  if (!orderEditTailorSelect) {
    return;
  }
  const normalizedSelected = selectedId ? String(selectedId) : '';
  orderEditTailorSelect.innerHTML = '';
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Sin asignar';
  if (!normalizedSelected) {
    emptyOption.selected = true;
  }
  orderEditTailorSelect.appendChild(emptyOption);
  let hasSelected = false;
  const tailors = Array.isArray(detailState.tailors) ? detailState.tailors : [];
  tailors.forEach((tailor) => {
    if (!tailor) {
      return;
    }
    const option = document.createElement('option');
    option.value = String(tailor.id);
    option.textContent = tailor.full_name || `Sastre #${tailor.id}`;
    if (normalizedSelected && String(tailor.id) === normalizedSelected) {
      option.selected = true;
      hasSelected = true;
    }
    orderEditTailorSelect.appendChild(option);
  });
  if (normalizedSelected && !hasSelected) {
    const fallback = document.createElement('option');
    fallback.value = normalizedSelected;
    fallback.textContent = selectedLabel || 'Sastre asignado';
    fallback.selected = true;
    orderEditTailorSelect.appendChild(fallback);
  }
}

function populateVendorOptions(selectedId, selectedLabel = '') {
  if (!orderEditVendorSelect) {
    return;
  }
  const normalizedSelected = selectedId ? String(selectedId) : '';
  orderEditVendorSelect.innerHTML = '';
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Sin asignar';
  if (!normalizedSelected) {
    emptyOption.selected = true;
  }
  orderEditVendorSelect.appendChild(emptyOption);
  let hasSelected = false;
  const vendors = Array.isArray(detailState.vendors) ? detailState.vendors : [];
  vendors.forEach((vendor) => {
    if (!vendor) {
      return;
    }
    const option = document.createElement('option');
    option.value = String(vendor.id);
    option.textContent = vendor.full_name || `Vendedor #${vendor.id}`;
    if (normalizedSelected && String(vendor.id) === normalizedSelected) {
      option.selected = true;
      hasSelected = true;
    }
    orderEditVendorSelect.appendChild(option);
  });
  if (normalizedSelected && !hasSelected) {
    const fallback = document.createElement('option');
    fallback.value = normalizedSelected;
    fallback.textContent = selectedLabel || 'Vendedor asignado';
    fallback.selected = true;
    orderEditVendorSelect.appendChild(fallback);
  }
}

function populateOriginOptions(selectedValue) {
  if (!orderEditOriginSelect) {
    return;
  }
  const normalizedSelected = selectedValue ? selectedValue.toString() : '';
  orderEditOriginSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona un establecimiento';
  placeholder.disabled = true;
  placeholder.hidden = true;
  if (!normalizedSelected) {
    placeholder.selected = true;
  }
  orderEditOriginSelect.appendChild(placeholder);
  ESTABLISHMENTS.forEach((branch) => {
    const option = document.createElement('option');
    option.value = branch;
    option.textContent = branch;
    if (branch === normalizedSelected) {
      option.selected = true;
    }
    orderEditOriginSelect.appendChild(option);
  });
  if (normalizedSelected && !ESTABLISHMENTS.includes(normalizedSelected)) {
    const fallback = document.createElement('option');
    fallback.value = normalizedSelected;
    fallback.textContent = normalizedSelected;
    fallback.selected = true;
    orderEditOriginSelect.appendChild(fallback);
  }
}

function setEditFeedback(message, type = 'info') {
  if (!orderEditFeedbackElement) {
    return;
  }
  orderEditFeedbackElement.classList.remove('is-success', 'is-error', 'is-warning');
  const normalized = message ? message.toString().trim() : '';
  if (!normalized) {
    orderEditFeedbackElement.textContent = '';
    orderEditFeedbackElement.classList.add('hidden');
    return;
  }
  orderEditFeedbackElement.textContent = normalized;
  orderEditFeedbackElement.classList.remove('hidden');
  if (type === 'success') {
    orderEditFeedbackElement.classList.add('is-success');
  } else if (type === 'error') {
    orderEditFeedbackElement.classList.add('is-error');
  } else if (type === 'warning') {
    orderEditFeedbackElement.classList.add('is-warning');
  }
}

function showCatalogWarningsIfNeeded() {
  if (!detailState.editingAllowed || !orderEditFeedbackElement) {
    return;
  }
  if (!detailState.catalogWarnings.length) {
    return;
  }
  if (!orderEditFeedbackElement.classList.contains('hidden')) {
    return;
  }
  setEditFeedback(detailState.catalogWarnings.join(' '), 'warning');
}

function populateOrderEditForm(order) {
  if (!detailState.editingAllowed || !orderEditFormElement || !order) {
    return;
  }
  if (orderEditContactInput) {
    orderEditContactInput.value = order.customer_contact || '';
  }
  if (orderEditInvoiceInput) {
    orderEditInvoiceInput.value = order.invoice_number || '';
  }
  populateStatusOptions(order.status || '');
  populateTailorOptions(order.assigned_tailor?.id ?? '', order.assigned_tailor?.full_name || '');
  populateVendorOptions(order.assigned_vendor?.id ?? '', order.assigned_vendor?.full_name || '');
  populateOriginOptions(order.origin_branch || '');
  if (orderEditDeliveryInput) {
    orderEditDeliveryInput.value = toInputDateTimeValue(order.delivery_date);
  }
  if (orderEditNotesTextarea) {
    orderEditNotesTextarea.value = order.notes || '';
  }
  orderEditFormElement.classList.remove('hidden');
  setEditFormDisabled(false);
  showCatalogWarningsIfNeeded();
}

function getTimeValue(value) {
  if (!value) return 0;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const priority = (task) =>
      typeof task?.status === 'string' && task.status.trim().toLowerCase() === ORDER_TASK_STATUS_COMPLETED
        ? 1
        : 0;
    const priorityDiff = priority(a) - priority(b);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return getTimeValue(a?.created_at) - getTimeValue(b?.created_at);
  });
}

function renderTasks(tasks, { loading = false, error = null } = {}) {
  if (!tasksContainerElement) return;
  tasksContainerElement.innerHTML = '';
  tasksContainerElement.classList.remove('muted', 'order-detail-error');
  if (loading) {
    tasksContainerElement.textContent = 'Cargando checklist de producción...';
    tasksContainerElement.classList.add('muted');
    return;
  }
  if (error) {
    tasksContainerElement.textContent = error;
    tasksContainerElement.classList.add('order-detail-error');
    return;
  }
  if (!Array.isArray(tasks) || !tasks.length) {
    tasksContainerElement.textContent = 'No hay tareas registradas para esta orden.';
    tasksContainerElement.classList.add('muted');
    return;
  }
  const list = document.createElement('ul');
  list.className = 'order-detail-task-list';
  sortTasks(tasks).forEach((task) => {
    const item = document.createElement('li');
    item.className = 'order-detail-task';
    const normalizedStatus = typeof task?.status === 'string' ? task.status.trim().toLowerCase() : '';
    if (normalizedStatus === ORDER_TASK_STATUS_COMPLETED) {
      item.classList.add('is-completed');
    } else {
      item.classList.add('is-pending');
    }

    const header = document.createElement('div');
    header.className = 'order-detail-task-header';
    header.appendChild(createTaskStatusBadge(task?.status));
    if (task?.updated_at) {
      const updated = document.createElement('span');
      updated.className = 'order-detail-task-meta';
      updated.textContent = `Actualizado: ${formatDate(task.updated_at)}`;
      header.appendChild(updated);
    }
    item.appendChild(header);

    const description = document.createElement('p');
    description.className = 'order-detail-task-description';
    description.textContent = task?.description?.trim()
      ? task.description.trim()
      : 'Sin descripción registrada.';
    item.appendChild(description);

    const metaParts = [];
    if (task?.responsible?.full_name) {
      metaParts.push(`Responsable: ${task.responsible.full_name}`);
    }
    if (task?.created_at) {
      metaParts.push(`Creada: ${formatDate(task.created_at)}`);
    }
    if (metaParts.length) {
      const meta = document.createElement('p');
      meta.className = 'order-detail-task-meta';
      meta.textContent = metaParts.join(' • ');
      item.appendChild(meta);
    }

    list.appendChild(item);
  });
  tasksContainerElement.appendChild(list);
}

function updateDocumentTitle(order) {
  if (!order) {
    document.title = 'Detalle de la orden | Portal de Sastrería';
    return;
  }
  const number = order.order_number || (order.id ? `#${order.id}` : '');
  if (number) {
    document.title = `Orden ${number} | Portal de Sastrería`;
  } else {
    document.title = 'Detalle de la orden | Portal de Sastrería';
  }
}

function renderOrder(order) {
  if (!order) {
    return;
  }
  updateDocumentTitle(order);
  const orderNumber = order.order_number || (order.id ? `#${order.id}` : '—');
  if (headingNumberElement) {
    headingNumberElement.textContent = orderNumber;
  }
  if (headingCreatedElement) {
    setSummaryField(headingCreatedElement, order.created_at ? formatDate(order.created_at) : '', '—');
  }
  if (headingUpdatedElement) {
    setSummaryField(headingUpdatedElement, order.updated_at ? formatDate(order.updated_at) : '', '—');
  }
  if (headingStatusElement) {
    headingStatusElement.innerHTML = '';
    headingStatusElement.appendChild(createStatusBadgeElement(order.status));
  }

  setSummaryField(summaryCustomerElement, order.customer_name || '', 'Sin registrar');
  setSummaryField(summaryDocumentElement, order.customer_document || '', 'Sin registrar');
  setSummaryField(summaryContactElement, order.customer_contact || '', 'Sin registrar');
  setSummaryField(summaryInvoiceElement, order.invoice_number || '', 'Sin número registrado');
  setSummaryField(summaryOriginElement, order.origin_branch || '', 'Sin definir');
  const deliveryLabel = formatDeliveryDateLabel(order);
  setSummaryField(summaryDeliveryElement, deliveryLabel || '', 'Sin fecha de entrega');
  setSummaryField(
    summaryTailorElement,
    order.assigned_tailor?.full_name || '',
    'Sin asignar'
  );
  setSummaryField(
    summaryVendorElement,
    order.assigned_vendor?.full_name || '',
    'Sin asignar'
  );

  renderNotes(order.notes);
  renderMeasurements(order.measurements);
}

function extractErrorMessage(data) {
  if (!data) {
    return '';
  }
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        if (item?.msg) return item.msg;
        if (item?.detail) return item.detail;
        if (item?.message) return item.message;
        if (typeof item === 'string') return item;
        try {
          return JSON.stringify(item);
        } catch (error) {
          return '';
        }
      })
      .filter(Boolean)
      .join(' ');
  }
  if (typeof data.detail === 'string') {
    return data.detail;
  }
  if (data.detail?.msg) {
    return data.detail.msg;
  }
  if (data.detail?.message) {
    return data.detail.message;
  }
  if (typeof data.message === 'string') {
    return data.message;
  }
  if (typeof data === 'string') {
    return data;
  }
  return '';
}

async function fetchWithAuth(path, token, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const fetchOptions = { method, headers };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
    fetchOptions.headers['Content-Type'] = 'application/json';
  }
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
  } catch (networkError) {
    throw new Error('No se pudo conectar con el servidor. Intenta nuevamente.');
  }
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseError) {
      data = null;
    }
  } else {
    data = await response.text();
  }
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
    }
    if (response.status === 404) {
      throw new Error('No encontramos la orden solicitada.');
    }
    const message = extractErrorMessage(data) || 'Error al cargar la información.';
    throw new Error(message);
  }
  return data;
}

async function fetchOrder(orderId, token) {
  return fetchWithAuth(`/orders/${orderId}`, token);
}

async function fetchOrderTasks(orderId, token) {
  const data = await fetchWithAuth(`/orders/${orderId}/tasks`, token);
  return Array.isArray(data) ? data : [];
}

async function loadCurrentUser(token) {
  const user = await fetchWithAuth('/users/me', token);
  if (!user) {
    throw new Error('No se pudo cargar la información del usuario.');
  }
  detailState.user = user;
  updateEditPermissions();
}

async function loadStatuses(token) {
  try {
    const data = await fetchWithAuth('/statuses', token);
    detailState.statuses = Array.isArray(data)
      ? data
        .map((status) => (status ? status.toString().trim() : ''))
        .filter(Boolean)
      : [];
    if (!detailState.statuses.length) {
      addCatalogWarning('No se pudieron cargar los estados disponibles.');
    }
  } catch (error) {
    detailState.statuses = [];
    addCatalogWarning('No se pudieron cargar los estados disponibles.');
  }
}

async function loadTailors(token) {
  try {
    const data = await fetchWithAuth('/users?role=sastre', token);
    detailState.tailors = Array.isArray(data) ? data : [];
  } catch (error) {
    detailState.tailors = [];
    addCatalogWarning('No se pudieron cargar los sastres disponibles.');
  }
}

async function loadVendors(token) {
  try {
    const data = await fetchWithAuth('/users?role=vendedor', token);
    detailState.vendors = Array.isArray(data) ? data : [];
  } catch (error) {
    detailState.vendors = [];
    addCatalogWarning('No se pudieron cargar los vendedores disponibles.');
  }
}

async function loadEditCatalogs(token) {
  detailState.catalogWarnings = [];
  await Promise.all([loadStatuses(token), loadTailors(token), loadVendors(token)]);
}

async function loadOrderDetails(orderId, token) {
  if (detailState.editingAllowed) {
    setEditFormDisabled(true);
  }
  setStatusMessage('Cargando información de la orden...', 'loading');
  try {
    const order = await fetchOrder(orderId, token);
    if (!order) {
      throw new Error('No se pudo cargar la información de la orden.');
    }
    detailState.order = order;
    if (order?.id) {
      detailState.orderId = order.id;
    }
    renderOrder(order);
    if (detailState.editingAllowed) {
      populateOrderEditForm(order);
    }
    showContent();
    clearStatusMessage();
    try {
      renderTasks([], { loading: true });
      const tasks = await fetchOrderTasks(orderId, token);
      renderTasks(tasks);
    } catch (taskError) {
      renderTasks([], { error: taskError.message || 'No se pudo cargar el checklist.' });
    }
  } catch (error) {
    if (detailState.editingAllowed) {
      setEditFormDisabled(true);
      if (orderEditFormElement) {
        orderEditFormElement.classList.add('hidden');
      }
    }
    hideContent();
    setStatusMessage(error.message || 'No se pudo cargar la información de la orden.', 'error');
  }
}

async function handleOrderEditSubmit(event) {
  event.preventDefault();
  if (!detailState.editingAllowed) {
    setEditFeedback('No tienes permisos para actualizar la orden.', 'error');
    return;
  }
  if (!detailState.orderId || !detailState.token) {
    setEditFeedback('No se puede identificar la orden para actualizarla.', 'error');
    return;
  }
  const originValue = orderEditOriginSelect?.value || '';
  if (!originValue) {
    setEditFeedback('Selecciona el establecimiento remitente.', 'error');
    if (orderEditOriginSelect) {
      orderEditOriginSelect.focus();
    }
    return;
  }

  const payload = {
    status: orderEditStatusSelect?.value || null,
    assigned_tailor_id: parseSelectNumber(orderEditTailorSelect?.value),
    assigned_vendor_id: parseSelectNumber(orderEditVendorSelect?.value),
    customer_contact: getTrimmedOrNull(orderEditContactInput?.value ?? ''),
    notes: getTrimmedOrNull(orderEditNotesTextarea?.value ?? ''),
    delivery_date: (() => {
      const normalized = normalizeDateForApi(orderEditDeliveryInput?.value || '');
      return normalized ? normalized : null;
    })(),
    invoice_number: getTrimmedOrNull(orderEditInvoiceInput?.value ?? ''),
    origin_branch: originValue,
  };

  setEditFormDisabled(true);
  setEditFeedback('Guardando cambios...', 'info');

  try {
    const updatedOrder = await fetchWithAuth(
      `/orders/${detailState.orderId}`,
      detailState.token,
      {
        method: 'PATCH',
        body: payload,
      },
    );
    if (!updatedOrder) {
      throw new Error('No se pudo actualizar la orden.');
    }
    detailState.order = updatedOrder;
    renderOrder(updatedOrder);
    populateOrderEditForm(updatedOrder);
    setEditFeedback('Orden actualizada correctamente.', 'success');
  } catch (error) {
    setEditFormDisabled(false);
    setEditFeedback(error.message || 'No se pudo actualizar la orden.', 'error');
  }
}

async function preparePage(orderId, token) {
  detailState.orderId = orderId;
  detailState.token = token;
  setStatusMessage('Cargando información de la orden...', 'loading');
  try {
    await loadCurrentUser(token);
  } catch (error) {
    hideContent();
    setStatusMessage(
      error.message || 'No se pudo cargar la información del usuario.',
      'error',
    );
    return;
  }
  if (detailState.editingAllowed) {
    await loadEditCatalogs(token);
  } else {
    detailState.catalogWarnings = [];
  }
  await loadOrderDetails(orderId, token);
}

if (orderEditFormElement) {
  orderEditFormElement.addEventListener('submit', handleOrderEditSubmit);
}

function initialise() {
  setCurrentYear();
  applyInitialOrderNumberFromQuery();
  const orderId = parseOrderId();
  if (!orderId) {
    setStatusMessage(
      'No se especificó una orden válida. Regresa al panel y selecciona una orden.',
      'error'
    );
    return;
  }
  const token = readStoredToken();
  if (!token) {
    setStatusMessage('Inicia sesión en el panel para ver la información de la orden.', 'error');
    return;
  }
  preparePage(orderId, token);
}

initialise();
