// Diagnostic only: actual route/handler source with fake DB/network; no real writes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const webRequire = createRequire(path.join(root, 'apps/web/package.json'));
const { NextResponse } = webRequire('next/server');
const quiet = { log() {}, warn() {}, error() {} };
const noop = () => {};
function source(file) { return ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX); }
function extract(file, name, scope) {
  const ast = source(file); let expression;
  function visit(n) { if (ts.isVariableDeclaration(n) && n.name.getText(ast) === name) expression = n.initializer.getText(ast); ts.forEachChild(n, visit); }
  visit(ast); if (!expression) throw Error(`Missing ${name}`);
  return vm.runInNewContext(ts.transpileModule(`const fn = ${expression};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + '\nfn', { console: quiet, setTimeout: noop, ...scope });
}
function route(file, prisma) {
  const js = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, URL, console: quiet, require: id => {
    if (id === 'next/server') return { NextResponse };
    if (id === '@/lib/prisma') return { prisma };
    if (id === 'bcryptjs') return {};
    throw Error(`Unexpected dependency ${id}`);
  } });
  return exports;
}
const results = [];
async function check(name, fn) { try { results.push({ name, ...await fn() }); } catch (e) { results.push({ name, harnessError: e.message }); } }
(async () => {
  await check('Fake authorization header must not reach platform tenant query', async () => {
    let queried = false;
    const api = route('apps/web/app/api/tenants/route.ts', { tenant: { findMany: async () => { queried = true; return []; } } });
    const res = await api.GET(new Request('https://fixture.invalid/api/tenants', { headers: { authorization: 'Bearer invalid-fixture' } }));
    return { passed: !queried && [401, 403].includes(res.status), observed: { status: res.status, queried } };
  });
  await check('Add staff must send UUID from actual default branch selector', async () => {
    const file = 'apps/web/app/settings/staff/page.tsx';
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    const branch = text.match(/\[staffBranch, setStaffBranch\] = useState\('([^']+)'\)/)?.[1];
    if (!branch) throw Error('Selector changed; update fixture extraction');
    let payload;
    const fn = extract(file, 'handleAddStaff', {
      fullName: 'Fixture User', staffEmail: 'fixture@example.invalid', staffPhone: '', staffRole: 'RECEPTIONIST', staffBranch: branch, tempPassword: 'fixture',
      fetch: async (url, init) => { payload = JSON.parse(init.body); return { ok: false, json: async () => ({ message: 'fixture' }) }; },
    });
    await fn({ preventDefault: noop });
    return { passed: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.branchId), observed: { branchId: payload.branchId } };
  });
  await check('Pet route must persist allergy and birth date supplied by form', async () => {
    let saved;
    const api = route('apps/web/app/api/pets/route.ts', {
      tenant: { findFirst: async () => ({ id: 't' }) }, customer: { findFirst: async () => ({ id: 'c' }) },
      pet: { create: async ({ data }) => { saved = data; return { ...data, id: 'p', customer: { firstName: 'Fixture', lastName: 'User' } }; } },
    });
    const res = await api.POST(new Request('https://fixture.invalid/api/pets', { method: 'POST', body: JSON.stringify({ customerId: 'c', name: 'Pet', allergies: 'fixture-allergy', birthDate: '2020-01-01', behavioralNotes: 'fixture-note' }) }));
    return { passed: saved.allergies === 'fixture-allergy' && !!saved.birthDate, observed: { status: res.status, allergyPersisted: !!saved.allergies, birthDatePersisted: !!saved.birthDate } };
  });
  await check('SOAP loader must unpack response and supply view model', async () => {
    let loaded, url;
    const fn = extract('apps/web/app/clinical/visits/[id]/soap/page.tsx', 'fetchVisit', {
      resolvedParams: { id: 'visit-fixture' }, setData: value => { loaded = value; },
      fetch: async requestUrl => { url = requestUrl; return { ok: true, json: async () => ({ success: true, data: { id: 'visit-fixture', vitals: { weightKg: 4 } } }) }; },
    });
    await fn();
    return { passed: !!loaded.vitals && loaded.visitId === 'visit-fixture', observed: { url, topLevelVitals: !!loaded.vitals, topLevelVisitId: !!loaded.visitId } };
  });
  await check('Grooming POST must return success after saving a BigInt price', async () => {
    let saved = false;
    const api = route('apps/web/app/api/grooming/route.ts', {
      tenant: { findFirst: async () => ({ id: 't' }) }, branch: { findFirst: async () => ({ id: 'b' }) },
      service: { findFirst: async () => ({ id: 's', basePriceMinor: 50000n }) },
      groomingQueueItem: { count: async () => 0, create: async ({ data }) => { saved = true; return { ...data, id: 'q' }; } },
    });
    const res = await api.POST(new Request('https://fixture.invalid/api/grooming', { method: 'POST', body: JSON.stringify({ customerId: 'c', petId: 'p', serviceId: 's' }) }));
    const body = await res.json();
    return { passed: res.ok, observed: { status: res.status, saved, message: body.message } };
  });
  console.log(JSON.stringify(results, null, 2));
  process.exitCode = results.some(r => !r.passed) ? 1 : 0;
})();
