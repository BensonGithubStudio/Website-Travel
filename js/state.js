window.App = window.App || {};

App.state = {
  entries: [],
  country: 'all',
  category: 'all',
  search: '',
  formCategory: 'customs',
  editingId: null,
  detailId: null,
  deleteConfirmId: null,
  busy: false
};

App.dom = {
  content: document.getElementById('content'),
  formOverlay: document.getElementById('formOverlay'),
  detailOverlay: document.getElementById('detailOverlay'),
  detailSheet: document.getElementById('detailSheet'),
  entryForm: document.getElementById('entryForm'),
  toastEl: document.getElementById('toast')
};
