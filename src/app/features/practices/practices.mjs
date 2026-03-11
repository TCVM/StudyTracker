import { getCurrentSubject } from '../../core/state.mjs';
import { showNotification } from '../../../utils/helpers.js';
import { saveData } from '../../core/storage.mjs';
import { showPromptModal } from '../../ui/prompt-modal.mjs';
import { hydrateThumbs } from '../../ui/thumbs.mjs';

function byId(id) {
  return document.getElementById(id);
}

export function ensureSubjectPractices(subject) {
  if (!subject || typeof subject !== 'object') return;
  if (!Array.isArray(subject.practices)) subject.practices = [];

  subject.practices = subject.practices
    .filter((p) => p && typeof p === 'object')
    .map((p, idx) => {
      const name = String(p.name ?? p.title ?? `Práctica ${idx + 1}`).trim() || `Práctica ${idx + 1}`;
      const exercisesRaw = Array.isArray(p.exercises) ? p.exercises : (Array.isArray(p.items) ? p.items : []);
      const exercises = exercisesRaw
        .filter((x) => x && typeof x === 'object')
        .map((x, xIdx) => {
          const answersRaw = Array.isArray(x.answers) ? x.answers : (Array.isArray(x.responses) ? x.responses : []);
          const answers = answersRaw
            .filter((a) => a && typeof a === 'object')
            .map((a, aIdx) => ({
              id: String(a.id ?? `ans_${Date.now()}_${idx}_${xIdx}_${aIdx}`),
              text: String(a.text ?? a.answer ?? a.content ?? '').trim(),
              images: Array.isArray(a.images) ? a.images.map(String).filter(Boolean) : []
            }))
            .filter((a) => a.text || a.images.length);

          return {
            id: String(x.id ?? `ex_${Date.now()}_${idx}_${xIdx}`),
            title: String(x.title ?? x.name ?? 'Ejercicio').trim() || 'Ejercicio',
            done: !!(x.done ?? x.completed),
            answers
          };
        });
      return { name, exercises };
    });
}

export function renderPractices() {
  const container = byId('practicesContainer');
  if (!container) return;

  const subject = getCurrentSubject();
  if (!subject) {
    container.innerHTML = '';
    return;
  }

  ensureSubjectPractices(subject);

  if (!subject.practices.length) {
    container.innerHTML = `
      <div class="sessions-empty" style="text-align:left;">
        No hay prácticas todavía. Usá <strong>+ Práctica</strong> para empezar.
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  subject.practices.forEach((practice, practiceIndex) => {
    const card = document.createElement('div');
    card.className = 'practice-card';
    card.dataset.practiceIndex = String(practiceIndex);

    const header = document.createElement('div');
    header.className = 'practice-header';
    header.textContent = practice.name || 'Práctica';

    const addExerciseBtn = document.createElement('button');
    addExerciseBtn.type = 'button';
    addExerciseBtn.className = 'btn btn-small practice-add-exercise';
    addExerciseBtn.textContent = '+ ejercicio';
    addExerciseBtn.dataset.practiceIndex = String(practiceIndex);
    header.appendChild(addExerciseBtn);
    card.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'practice-items';

    (practice.exercises || []).forEach((exercise, exerciseIndex) => {
      const li = document.createElement('li');
      li.className = 'practice-item';
      li.dataset.exerciseIndex = String(exerciseIndex);
      li.dataset.practiceIndex = String(practiceIndex);

      const row = document.createElement('div');
      row.className = 'practice-item-row';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!exercise.done;
      checkbox.className = 'practice-checkbox';
      checkbox.dataset.practiceIndex = String(practiceIndex);
      checkbox.dataset.exerciseIndex = String(exerciseIndex);
      row.appendChild(checkbox);

      const label = document.createElement('span');
      label.textContent = exercise.title || 'Ejercicio';
      row.appendChild(label);

      li.appendChild(row);

      const answers = Array.isArray(exercise.answers) ? exercise.answers : [];
      const details = document.createElement('details');
      details.className = 'practice-answers';

      const summary = document.createElement('summary');
      summary.textContent = `Respuestas (${answers.length})`;
      details.appendChild(summary);

      const body = document.createElement('div');
      body.className = 'practice-answers-body';

      const actions = document.createElement('div');
      actions.className = 'practice-answers-actions';
      const addAnsBtn = document.createElement('button');
      addAnsBtn.type = 'button';
      addAnsBtn.className = 'btn btn-secondary btn-small practice-answer-add-btn';
      addAnsBtn.textContent = '+ Respuesta';
      addAnsBtn.dataset.practiceIndex = String(practiceIndex);
      addAnsBtn.dataset.exerciseIndex = String(exerciseIndex);
      actions.appendChild(addAnsBtn);
      body.appendChild(actions);

      const listAnswers = document.createElement('div');
      listAnswers.className = 'practice-answers-list';
      if (!answers.length) {
        listAnswers.innerHTML = `<div class="links-empty">No hay respuestas todavía.</div>`;
      } else {
        for (const ans of answers) {
          const item = document.createElement('div');
          item.className = 'practice-answer-item';
          item.dataset.answerId = ans.id;

          const text = document.createElement('div');
          text.className = 'practice-answer-text';
          const preview = String(ans.text ?? '').trim();
          const imgCount = Array.isArray(ans.images) ? ans.images.length : 0;
          text.textContent = preview ? preview : (imgCount ? '(solo imágenes)' : '');
          item.appendChild(text);

          const meta = document.createElement('div');
          meta.className = 'practice-answer-meta';
          meta.textContent = imgCount ? `Imágenes: ${imgCount}` : '';
          item.appendChild(meta);

          if (imgCount) {
            const thumbs = document.createElement('div');
            thumbs.className = 'answer-thumbs practice-answer-thumbs';
            thumbs.dataset.imageIds = JSON.stringify(ans.images ?? []);
            thumbs.dataset.limit = '3';
            item.appendChild(thumbs);
          }

          const editBtn = document.createElement('button');
          editBtn.type = 'button';
          editBtn.className = 'btn btn-secondary btn-small practice-answer-edit-btn';
          editBtn.textContent = 'Editar';
          editBtn.dataset.practiceIndex = String(practiceIndex);
          editBtn.dataset.exerciseIndex = String(exerciseIndex);
          editBtn.dataset.answerId = String(ans.id);
          item.appendChild(editBtn);

          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-secondary btn-small practice-answer-del-btn';
          delBtn.textContent = 'Eliminar';
          delBtn.dataset.practiceIndex = String(practiceIndex);
          delBtn.dataset.exerciseIndex = String(exerciseIndex);
          delBtn.dataset.answerId = String(ans.id);
          item.appendChild(delBtn);

          listAnswers.appendChild(item);
        }
      }
      body.appendChild(listAnswers);
      details.appendChild(body);
      li.appendChild(details);

      list.appendChild(li);
    });

    card.appendChild(list);
    container.appendChild(card);
  });

  container.classList.toggle('practices-scroll', subject.practices.length >= 5);

  // hydrate thumbnails (async, best-effort)
  queueMicrotask(() => {
    try {
      hydrateThumbs(container, '.practice-answer-thumbs');
    } catch {
      // ignore
    }
  });
}

export async function addPractice() {
  const subject = getCurrentSubject();
  if (!subject) {
    showNotification('Selecciona una materia primero');
    return;
  }

  ensureSubjectPractices(subject);

  const name = await showPromptModal({
    title: 'Nueva práctica',
    label: 'Nombre de la práctica',
    placeholder: 'Ej: TP 1 / Guía 3',
    defaultValue: 'Nueva práctica',
    confirmText: 'Agregar',
    cancelText: 'Cancelar'
  });
  if (name == null) return;

  subject.practices.push({ name: String(name).trim() || 'Práctica', exercises: [] });
  saveData(true);
  renderPractices();
}

export async function addExercise(practiceIndex) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectPractices(subject);

  const practice = subject.practices?.[practiceIndex];
  if (!practice) return;

  const title = await showPromptModal({
    title: 'Nuevo ejercicio',
    label: 'Título del ejercicio',
    placeholder: 'Ej: Ejercicio 4 / Integrador',
    defaultValue: 'Ejercicio',
    confirmText: 'Agregar',
    cancelText: 'Cancelar'
  });
  if (title == null) return;

  if (!Array.isArray(practice.exercises)) practice.exercises = [];
  practice.exercises.push({ id: `ex_${Date.now()}`, title: String(title).trim() || 'Ejercicio', done: false });
  saveData(true);
  renderPractices();
}

export function toggleExerciseDone(practiceIndex, exerciseIndex) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectPractices(subject);

  const practice = subject.practices?.[practiceIndex];
  if (!practice) return;
  const ex = practice.exercises?.[exerciseIndex];
  if (!ex) return;

  ex.done = !ex.done;
  saveData(true);
  renderPractices();
}
