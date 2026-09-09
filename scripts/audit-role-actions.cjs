// Read-only diagnostic: execute current UI handlers with controlled API responses.
// No browser, database, credentials, or network calls. Not a full React/E2E test.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const noop = () => {};
function handler(file, name, scope) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) expression = node.initializer.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!expression) throw new Error(`Handler missing: ${file}:${name}`);
  const js = ts.transpileModule(`const extracted = ${expression};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return vm.runInNewContext(`${js}\nextracted`, { console, setTimeout: noop, ...scope });
}
const event = { preventDefault: noop };
const failed = async () => ({ ok: false, status: 500, json: async () => ({ message: 'Controlled API failure' }) });
const checks = [];
async function check(name, run) {
  try { const result = await run(); checks.push({ name, ...result }); }
  catch (error) { checks.push({ name, harnessError: error.message }); }
}
(async () => {
  await check('Successful Nest login response must authenticate real user', async () => {
    let profile;
    const fn = handler('apps/web/contexts/auth-context.tsx', 'loginWithCredentials', {
      process: { env: {} }, PRESET_USERS: {}, setUser: p => { profile = p; },
      fetch: async () => ({ ok: true, json: async () => ({ success: true, data: { user: { id: 'real-user', email: 'user@example.invalid', firstName: 'Test', lastName: 'User', role: 'RECEPTIONIST', allowedBranches: [] }, tokens: { accessToken: 'fixture' } } }) }),
    });
    const result = await fn('user@example.invalid', 'fixture');
    return { passed: result.success && !!profile, observed: { success: result.success, profileCreated: !!profile } };
  });
  await check('Appointment HTTP 500 must not announce success', async () => {
    let notified = false, success = false;
    const customer = { customerId: 'c1', petId: 'p1', customerName: 'Test', petName: 'Pet', petSpecies: 'DOG' };
    const fn = handler('apps/web/components/appointments/new-appointment-modal.tsx', 'handleSubmit', {
      setIsSubmitting: noop, PRESET_STAFF: [{ id: 'auto' }], selectedStaffId: 'auto', isNewCustomer: false,
      selectedPresetCustomer: customer, bookingDate: '2026-09-09', bookingTime: '10:00', calculatedEndTime: '11:00',
      activeService: { id: 's1' }, notes: '', source: 'PHONE', bookingMode: 'APPOINTMENT', fetch: failed,
      notifyAppointmentCreated: () => { notified = true; }, setSuccessMessage: () => { success = true; }, closeBookingModal: noop,
    });
    await fn(event);
    return { passed: !notified && !success, observed: { notified, success } };
  });
  await check('Customer + pet must report pet HTTP 500', async () => {
    let redirected = false, error = null;
    const fn = handler('apps/web/app/customers/new/page.tsx', 'handleSubmit', {
      formData: { firstName: 'Test', lastName: 'User', phone: '0800000000', petName: 'Pet' },
      includePet: true, setErrorMessage: value => { error = value; }, setIsSubmitting: noop,
      fetch: async url => url === '/api/customers' ? { ok: true, json: async () => ({ customer: { id: 'c1' } }) } : failed(),
      router: { push: () => { redirected = true; } },
    });
    await fn(event);
    return { passed: !!error && !redirected, observed: { redirected, error } };
  });
  await check('Add staff must send chosen password/branch and reject HTTP 500', async () => {
    let payload, announced = false;
    const fn = handler('apps/web/app/settings/staff/page.tsx', 'handleAddStaff', {
      fullName: 'Test User', staffEmail: 'staff@example.invalid', staffPhone: '', staffRole: 'RECEPTIONIST',
      roleTitles: {}, gradients: {}, staffBranch: 'branch-2', tempPassword: 'chosen-fixture', staffList: [],
      updateStaffList: noop, setIsAddModalOpen: noop, setToastMessage: () => { announced = true; },
      setCreatedSuccessStaff: noop, setIsCopied: noop, setFullName: noop, setStaffEmail: noop, setStaffPhone: noop,
      fetch: async (url, init) => { payload = JSON.parse(init.body); return failed(); },
    });
    await fn(event);
    return { passed: !announced && payload.password === 'chosen-fixture' && payload.branchId === 'branch-2', observed: { announced, passwordSent: 'password' in payload, branchSent: 'branchId' in payload } };
  });
  await check('SOAP HTTP 401 must not announce saved or add local audit history', async () => {
    let success = false, updated = false;
    const fn = handler('apps/web/app/clinical/visits/[id]/soap/page.tsx', 'handleSaveSoap', {
      data: { visitId: 'visit-fixture', historyEntries: [], vitals: {} }, auditNote: '',
      setIsSaving: noop, setSaveSuccess: value => { success = value; }, setAuditNote: noop,
      setData: () => { updated = true; }, fetch: async () => ({ ok: false, status: 401 }),
    });
    await fn();
    return { passed: !success && !updated, observed: { success, updated } };
  });
  await check('Service commission entered as zero must stay zero', async () => {
    let added;
    const fn = handler('apps/web/app/services/page.tsx', 'handleSaveService', {
      formName: 'Fixture service', formPrice: '500', formDuration: '60', formCommission: '0',
      formCategory: 'GROOMING', formSpecies: 'DOG', formDescription: '', editingService: null,
      setServices: update => { added = update([])[0]; }, showToast: noop, setIsModalOpen: noop,
    });
    fn(event);
    return { passed: added.commissionRate === 0, observed: { commissionRate: added.commissionRate } };
  });
  console.log(JSON.stringify(checks, null, 2));
  process.exitCode = checks.some(c => !c.passed) ? 1 : 0;
})();
