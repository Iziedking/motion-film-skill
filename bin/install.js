#!/usr/bin/env node
'use strict';
/* Copies skills/motion-film into an agent's skills folder.

   npx github:Iziedking/motion-film-skill                  Claude Code, user folder
   npx github:Iziedking/motion-film-skill --agent cursor   another agent
   npx github:Iziedking/motion-film-skill --project        ./.claude/skills in this project
   npx github:Iziedking/motion-film-skill --dir <path>     any folder */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const AGENTS = {
  claude: '.claude/skills',
  cursor: '.cursor/skills',
  codex: '.codex/skills',
  copilot: '.github/skills',
  gemini: '.gemini/skills',
  windsurf: '.codeium/windsurf/skills',
  opencode: '.opencode/skills',
  goose: '.goose/skills',
  amp: '.agents/skills',
};

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1] ?? true;
};

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Install the motion-film skill.

  --agent <name>   ${Object.keys(AGENTS).join(', ')} (default: claude)
  --project        install into this project instead of your home folder
  --dir <path>     install into an explicit skills folder
  --force          replace an existing install`);
  process.exit(0);
}

const agent = String(flag('--agent') || 'claude');
if (!AGENTS[agent] && !flag('--dir')) {
  console.error(`Unknown agent "${agent}". Use one of: ${Object.keys(AGENTS).join(', ')}, or --dir <path>.`);
  process.exit(1);
}
const base = flag('--dir')
  ? path.resolve(String(flag('--dir')))
  : path.join(args.includes('--project') ? process.cwd() : os.homedir(), AGENTS[agent]);
const source = path.join(__dirname, '..', 'skills', 'motion-film');
const target = path.join(base, 'motion-film');

if (fs.existsSync(target) && !args.includes('--force')) {
  console.error(`${target} already exists. Re-run with --force to replace it.`);
  process.exit(1);
}
fs.mkdirSync(base, { recursive: true });
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log(`Installed motion-film to ${target}`);
console.log('Restart your agent, then try: "Use the motion-film skill to plan a 15-second advert for ..."');
