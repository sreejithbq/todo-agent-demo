import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesSourceDir = path.join(repoRoot, '.agents', 'rules');
const skillsSourceDir = path.join(repoRoot, '.agents', 'skills');

const RULE_TARGETS = [
  { directory: '.claude/rules', extension: '.md' },
  { directory: '.cursor/rules', extension: '.mdc' },
  { directory: '.github/instructions', extension: '.instructions.md' },
];

const SKILL_TARGETS = ['.claude/skills', '.github/skills'];

const DIRECTORY_LINK_TYPE = process.platform === 'win32' ? 'junction' : 'dir';

function assertSourceDirectory(directory, label) {
  let stats;

  try {
    stats = fs.statSync(directory);
  } catch {
    throw new Error(`Missing canonical ${label} directory: ${path.relative(repoRoot, directory)}`);
  }

  if (!stats.isDirectory()) {
    throw new Error(`Canonical ${label} path is not a directory: ${path.relative(repoRoot, directory)}`);
  }
}

function removeManagedPath(targetPath) {
  let stats;

  try {
    stats = fs.lstatSync(targetPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }

    throw error;
  }

  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    fs.unlinkSync(targetPath);
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

function createRelativeLink(linkPath, targetPath, type) {
  const relativeTarget = path.relative(path.dirname(linkPath), targetPath);

  fs.symlinkSync(relativeTarget, linkPath, type);

  console.log(`  ${path.relative(repoRoot, linkPath)} -> ${relativeTarget}`);

  return 1;
}

function main() {
  assertSourceDirectory(rulesSourceDir, 'rules');
  assertSourceDirectory(skillsSourceDir, 'skills');

  const ruleFiles = fs
    .readdirSync(rulesSourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();

  for (const target of RULE_TARGETS) {
    removeManagedPath(path.join(repoRoot, target.directory));
  }

  for (const target of SKILL_TARGETS) {
    removeManagedPath(path.join(repoRoot, target));
  }

  for (const target of RULE_TARGETS) {
    fs.mkdirSync(path.join(repoRoot, target.directory), { recursive: true });
  }

  for (const target of SKILL_TARGETS) {
    fs.mkdirSync(path.dirname(path.join(repoRoot, target)), { recursive: true });
  }

  console.log('Linking agent configuration...');

  let created = 0;

  for (const ruleFile of ruleFiles) {
    const baseName = ruleFile.slice(0, -'.md'.length);

    for (const target of RULE_TARGETS) {
      const linkPath = path.join(repoRoot, target.directory, `${baseName}${target.extension}`);
      const sourcePath = path.join(rulesSourceDir, ruleFile);

      created += createRelativeLink(linkPath, sourcePath, 'file');
    }
  }

  for (const target of SKILL_TARGETS) {
    const linkPath = path.join(repoRoot, target);

    created += createRelativeLink(linkPath, skillsSourceDir, DIRECTORY_LINK_TYPE);
  }

  console.log(
    `Done: created ${created} symlinks (${ruleFiles.length} rule(s), ${SKILL_TARGETS.length} skill link(s)).`,
  );
}

try {
  main();
} catch (error) {
  console.error(`Failed to link agent configuration: ${error.message}`);
  process.exitCode = 1;
}
