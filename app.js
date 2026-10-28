'use strict';

// Core content lives in HTML. JavaScript only enriches native case disclosures.
const status = document.querySelector('.project-load-status');
const retryButton = document.querySelector('.retry-notes');
const disclosures = [...document.querySelectorAll('[data-project]')];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function validateProjects(data) {
  if (!data || !Array.isArray(data.projects) || data.projects.length !== disclosures.length) {
    throw new Error('Expected one case study for each HTML disclosure.');
  }
  const expectedIds = new Set(disclosures.map((item) => item.dataset.project));
  const seen = new Set();
  const textFields = ['id', 'title', 'company', 'status', 'problem', 'contribution', 'outcome', 'evidence'];
  for (const project of data.projects) {
    if (textFields.some((key) => typeof project[key] !== 'string' || !project[key].trim())) {
      throw new Error('Case study is missing required text.');
    }
    if (!expectedIds.has(project.id) || seen.has(project.id)) throw new Error('Case IDs must match the HTML and be unique.');
    if (!Array.isArray(project.decisions) || !project.decisions.length || project.decisions.some((value) => typeof value !== 'string' || !value.trim())) {
      throw new Error('Case study decisions must be a non-empty text array.');
    }
    seen.add(project.id);
  }
  return data.projects;
}

function caseNote(title, content) {
  const section = element('section', 'case-note');
  section.append(element('h4', '', title));
  if (Array.isArray(content)) {
    const list = element('ul');
    content.forEach((item) => list.append(element('li', '', item)));
    section.append(list);
  } else {
    section.append(element('p', '', content));
  }
  return section;
}

function renderCase(project, disclosure) {
  const notes = element('div', 'notes-grid');
  notes.append(
    caseNote('The problem', project.problem),
    caseNote('My contribution', project.contribution),
    caseNote('Technical decisions', project.decisions),
    caseNote('The outcome', project.outcome)
  );
  const evidence = element('div', 'evidence-note');
  evidence.append(element('span', 'label', 'Scope & evidence'), element('p', '', project.evidence));
  disclosure.querySelector('.case-detail-content').replaceChildren(notes, evidence);
  disclosure.dataset.loaded = 'true';
}

async function loadNotes() {
  const restoreFocus = document.activeElement === retryButton;
  retryButton.disabled = true;
  try {
    const response = await fetch('./projects.json');
    if (!response.ok) throw new Error('Case notes unavailable.');
    const projects = validateProjects(await response.json());
    projects.forEach((project) => renderCase(project, disclosures.find((item) => item.dataset.project === project.id)));
    status.hidden = true;
    if (restoreFocus) disclosures[0].querySelector('summary').focus({ preventScroll: true });
  } catch {
    // Keep all original HTML content and native disclosures usable.
    status.hidden = false;
  } finally {
    retryButton.disabled = false;
  }
}

retryButton.addEventListener('click', loadNotes);
loadNotes();
