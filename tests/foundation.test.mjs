import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import vm from 'node:vm';
import {projectRoot, composeSource, readFrozen, sha256} from '../tools/compose-source.mjs';
import {DIRECTOR_PRODUCT, DIRECTOR_IDENTITIES} from '../entry.js';

const read = file => readFile(new URL(file, projectRoot), 'utf8');
const manifest = JSON.parse(await read('manifest.json'));
const pkg = JSON.parse(await read('package.json'));
const {script, lock} = await readFrozen();

test('foundation / Owner JSON and stable script ID are the sole functional authority', () => {
  assert.equal(lock.artifactSha256, '26a00694d6e76d3e240bd2b51909f937f317901efa4804efe30bc3744721c743');
  assert.equal(lock.contentSha256, 'b34f6142b3a4ea2c32986060f508374f26644415d33b312fba825ec17d25554f');
  assert.equal(script.id, DIRECTOR_IDENTITIES.scriptId);
  assert.equal(script.type, 'script');assert.deepEqual(script.data, {});
});
test('foundation / Phase 2 assembly is byte-identical, including legacy presentation', async () => {
  const source = await composeSource();assert.equal(source, script.content);
  assert.equal(sha256(source), lock.contentSha256);new vm.Script(source);
});
test('foundation / extracted fragments came from the supplied JSON unchanged', async () => {
  for (const [name, part] of Object.entries(lock.parts)) {
    const text = await read(part.path);assert.equal(sha256(text), part.sha256, name);
    if (name !== 'runtime') assert.equal(script.content.split(text).length, 2, name);
  }
});
test('foundation / display identity matches manifest without renaming historical keys', async () => {
  assert.equal(DIRECTOR_PRODUCT.name, '咩咩故事导演');assert.equal(DIRECTOR_PRODUCT.englishName, 'MieMie Story Director');
  assert.equal(manifest.id, DIRECTOR_IDENTITIES.productId);assert.equal(manifest.name, DIRECTOR_PRODUCT.name);
  assert.equal(manifest.contributes.launcher.title, DIRECTOR_PRODUCT.launcherName);
  assert.equal(manifest.repository, DIRECTOR_PRODUCT.repository);
  const source = await composeSource();assert.ok(source.includes("extension_id:'" + DIRECTOR_IDENTITIES.settings + "'"));
  assert.ok(source.includes("KEY_STORE='" + DIRECTOR_IDENTITIES.apiKey + "'"));
  assert.ok(source.includes("ID='" + DIRECTOR_IDENTITIES.runtimeMarker + "'"));
  assert.ok(source.includes("type:'" + DIRECTOR_IDENTITIES.promptFileType + "',version:1"));
  assert.equal(DIRECTOR_IDENTITIES.dock, 'miemie_story_director_dock_v1');
});
test('foundation / manifest declares API v1 and uses real local files', async () => {
  assert.equal(manifest.schemaVersion, 1);assert.equal(manifest.apiVersion, 2);
  assert.deepEqual(manifest.hubApi, {min: 2, max: 2});assert.match(manifest.id, /^[a-z0-9][a-z0-9._-]{1,79}$/);
  for (const key of ['name', 'version', 'author', 'description', 'entry', 'repository', 'license']) assert.ok(manifest[key]);
  assert.ok((await stat(new URL(manifest.entry, projectRoot))).isFile());
  assert.ok((await stat(new URL(manifest.icon, projectRoot))).isFile());
});
test('foundation / current version is consistent while historical baseline stays 0.1.22', async () => {
  const dependencies=JSON.parse(await read('package-lock.json'));
  const template=JSON.parse(await read('packaging/script-template.json'));
  assert.equal(DIRECTOR_PRODUCT.version,'0.2.0');
  for(const value of [pkg.version,manifest.version,dependencies.version,dependencies.packages[''].version])assert.equal(value,DIRECTOR_PRODUCT.version);
  assert.equal(template.name,`${DIRECTOR_PRODUCT.name} ${DIRECTOR_PRODUCT.version}`);
  assert.match(DIRECTOR_PRODUCT.version,/^\d+\.\d+\.\d+$/);
  assert.equal(lock.version, '0.1.22');assert.equal(pkg.private, true);
});
test('foundation / preset location IDs stay in the Core compatibility contract', async () => {
  const core = await read('src/core.js');
  for (const id of ['20f5f445-aba9-42aa-a1f4-927e28384f84', '72ffe882-e589-4382-933e-fd6c30fc77ec', 'eeb2fe7b-8902-4678-ac58-1bcb91cdbfa9']) assert.ok(core.includes(id));
});
test('foundation / approved icon original PNG is unchanged and reserved separately', async () => {
  const image = await readFile(new URL('assets/icon.png', projectRoot));assert.equal(sha256(image), lock.approvedIconSha256);
  assert.equal(image.subarray(1, 4).toString(), 'PNG');assert.equal(image[25], 6);
  assert.equal(image.readUInt32BE(16), 1254);assert.equal(image.readUInt32BE(20), 1254);
  assert.ok((await read('ASSETS-LICENSE.md')).includes('assets/icon.png'));
});
test('foundation / historical image remains byte-identical until authorized UI phase', async () => {
  const bytes = await readFile(new URL('assets/legacy-icon.png', projectRoot));assert.equal(sha256(bytes), lock.legacyIconSha256);
});
test('foundation / software GPL and reserved-art policy are explicit', async () => {
  assert.equal(manifest.license, 'GPL-3.0-or-later');assert.equal(pkg.license, manifest.license);
  assert.ok((await read('LICENSE')).includes('GNU GENERAL PUBLIC LICENSE'));
  assert.ok((await read('BRAND.md')).includes('MieMie Brand Policy'));
  assert.ok((await read('ASSETS-LICENSE.md')).includes('不包含在软件 GPL 授权中'));
});
test('foundation / packaging template keeps script ID and empty data; not a release', async () => {
  const template = JSON.parse(await read('packaging/script-template.json'));
  assert.equal(template.id, script.id);assert.equal(template.content, '');assert.deepEqual(template.data, {});
  assert.equal(template.enabled, script.enabled);assert.deepEqual(template.export_with, script.export_with);
  assert.ok(!(await read('src/core.js')).includes('private-test-key'));
});
test('foundation / phase boundary retains Deferred items and no factory claim', async () => {
  const boundary = await read('docs/DEFERRED.md');
  for (const id of ['D-001', 'D-002', 'D-003']) assert.ok(boundary.includes(id));
  assert.ok(boundary.includes('DEFERRED / POST-RELEASE FOLLOW-UP'));
  const entry = await read('entry.js');assert.ok(entry.includes('Phase 3'));assert.ok(!entry.includes('extensions.provide('));
});
