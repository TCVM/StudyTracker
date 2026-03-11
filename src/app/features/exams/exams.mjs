import { getCurrentSubject } from '../../core/state.mjs';
import { showNotification } from '../../../utils/helpers.js';
import { saveData } from '../../core/storage.mjs';
import { awardXp, deductXp, getDifficultyConfigForSubject } from '../xp/xp.mjs';
import { showPromptModal } from "../../ui/prompt-modal.mjs";
import { showConfirmModalV2 } from '../../ui/confirm-modal.mjs';
import { deleteImage } from '../../core/idb.mjs';
import { hydrateThumbs } from '../../ui/thumbs.mjs';

function byId(id) {
  return document.getElementById(id);
}

export function ensureSubjectExams(subject) {
  if (!subject || typeof subject !== 'object') return;
  if (!Array.isArray(subject.exams)) subject.exams = [];

  subject.exams = subject.exams
    .filter((c) => c && typeof c === 'object')
    .map((c, catIdx) => {
      const name = String(c.name ?? c.title ?? `Categoría ${catIdx + 1}`).trim() || `Categoría ${catIdx + 1}`;
      const itemsRaw = Array.isArray(c.items) ? c.items : [];
      const items = itemsRaw
        .filter((x) => x && typeof x === 'object')
        .map((x, itemIdx) => {
          const title = String(x.title ?? x.name ?? `Examen ${itemIdx + 1}`).trim() || `Examen ${itemIdx + 1}`;
          const questionsRaw = Array.isArray(x.questions) ? x.questions : (Array.isArray(x.qa) ? x.qa : []);
          const questions = questionsRaw
            .filter((q) => q && typeof q === 'object')
            .map((q, qIdx) => {
              const id = String(q.id ?? `q_${Date.now()}_${catIdx}_${itemIdx}_${qIdx}`);
              const question = String(q.q ?? q.question ?? q.text ?? '').trim();
              const answersRaw = Array.isArray(q.answers) ? q.answers : (q.a || q.answer ? [{ text: q.a ?? q.answer }] : []);
              const answers = answersRaw
                .filter((a) => a && typeof a === 'object')
                .map((a, aIdx) => ({
                  id: String(a.id ?? `ans_${Date.now()}_${catIdx}_${itemIdx}_${qIdx}_${aIdx}`),
                  text: String(a.text ?? a.answer ?? a.content ?? '').trim(),
                  images: Array.isArray(a.images) ? a.images.map(String).filter(Boolean) : []
                }))
                .filter((a) => a.text || a.images.length);
              return { id, q: question, answers };
            })
            .filter((q) => q.q || (q.answers?.length ?? 0));

          return {
            ...x,
            title,
            completed: !!x.completed,
            questions
          };
        });
      return { ...c, name, items };
    });
}

export function renderExams() {
  const container = byId('examsContainer');
  if (!container) return;
  const subject = getCurrentSubject();
  if (!subject) {
    container.innerHTML = '';
    return;
  }
  ensureSubjectExams(subject);

  container.innerHTML = '';

  if (!subject.exams.length) {
    container.innerHTML = `
      <div class="sessions-empty" style="text-align:left;">
        No hay categorías todavía. Usá <strong>+ Categoría</strong> para empezar.
      </div>
    `;
    return;
  }

  subject.exams.forEach((cat, catIndex) => {
    const catDiv = document.createElement('div');
    catDiv.className = 'exam-category';
    catDiv.dataset.categoryIndex = catIndex;

    const header = document.createElement('div');
    header.className = 'exam-category-header';
    header.textContent = cat.name || 'Categoría';
    const addItemBtn = document.createElement('button');
    addItemBtn.type = 'button';
    addItemBtn.className = 'btn btn-small exam-add-item';
    addItemBtn.textContent = '+ ítem';
    header.appendChild(addItemBtn);
    catDiv.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'exam-items';
    (cat.items || []).forEach((item, itemIndex) => {
      const li = document.createElement('li');
      li.className = 'exam-item';
      li.dataset.itemIndex = itemIndex;

      const row = document.createElement('div');
      row.className = 'exam-item-row';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!item.completed;
      checkbox.className = 'exam-checkbox';
      row.appendChild(checkbox);

      const label = document.createElement('span');
      label.className = 'exam-item-title';
      label.textContent = item.title || 'Examen';
      row.appendChild(label);

      if (item.attachment) {
        const a = document.createElement('a');
        a.href = item.attachment;
        a.target = '_blank';
        a.textContent = item.filename || 'Adjunto';
        row.appendChild(a);
      }
      // add attach button
      const attachBtn = document.createElement('button');
      attachBtn.type = 'button';
      attachBtn.className = 'btn btn-small exam-attach-btn';
      attachBtn.textContent = '📎';
      attachBtn.dataset.categoryIndex = catIndex;
      attachBtn.dataset.itemIndex = itemIndex;
      row.appendChild(attachBtn);

      li.appendChild(row);

      const questions = Array.isArray(item.questions) ? item.questions : [];
      const details = document.createElement('details');
      details.className = 'exam-qa';

      const summary = document.createElement('summary');
      summary.textContent = `Preguntas (${questions.length})`;
      details.appendChild(summary);

      const qaBody = document.createElement('div');
      qaBody.className = 'exam-qa-body';

      const qaActions = document.createElement('div');
      qaActions.className = 'exam-qa-actions';
      const addQBtn = document.createElement('button');
      addQBtn.type = 'button';
      addQBtn.className = 'btn btn-secondary btn-small exam-question-add-btn';
      addQBtn.textContent = '+ Pregunta';
      addQBtn.dataset.categoryIndex = catIndex;
      addQBtn.dataset.itemIndex = itemIndex;
      qaActions.appendChild(addQBtn);
      qaBody.appendChild(qaActions);

      const qList = document.createElement('div');
      qList.className = 'exam-qa-list';
      if (!questions.length) {
        qList.innerHTML = `<div class="links-empty">No hay preguntas todavía.</div>`;
      } else {
        for (const q of questions) {
          const qDetails = document.createElement('details');
          qDetails.className = 'exam-question';
          qDetails.dataset.questionId = String(q.id);

          const qSummary = document.createElement('summary');
          const ansCount = Array.isArray(q.answers) ? q.answers.length : 0;
          qSummary.textContent = `${q.q || 'Pregunta'}${ansCount ? ` (${ansCount})` : ''}`;
          qDetails.appendChild(qSummary);

          const qBody = document.createElement('div');
          qBody.className = 'exam-question-body';

          const qActions = document.createElement('div');
          qActions.className = 'exam-question-actions';

          const addAnsBtn = document.createElement('button');
          addAnsBtn.type = 'button';
          addAnsBtn.className = 'btn btn-secondary btn-small exam-answer-add-btn';
          addAnsBtn.textContent = '+ Respuesta';
          addAnsBtn.dataset.categoryIndex = catIndex;
          addAnsBtn.dataset.itemIndex = itemIndex;
          addAnsBtn.dataset.questionId = String(q.id);
          qActions.appendChild(addAnsBtn);

          const delQBtn = document.createElement('button');
          delQBtn.type = 'button';
          delQBtn.className = 'btn btn-secondary btn-small exam-question-del-btn';
          delQBtn.textContent = 'Eliminar';
          delQBtn.dataset.categoryIndex = catIndex;
          delQBtn.dataset.itemIndex = itemIndex;
          delQBtn.dataset.questionId = String(q.id);
          qActions.appendChild(delQBtn);

          qBody.appendChild(qActions);

          const ansList = document.createElement('div');
          ansList.className = 'exam-answers-list';
          const answers = Array.isArray(q.answers) ? q.answers : [];
          if (!answers.length) {
            ansList.innerHTML = `<div class="links-empty">Todavía no hay respuestas.</div>`;
          } else {
            for (const ans of answers) {
              const ansItem = document.createElement('div');
              ansItem.className = 'exam-answer-item';
              ansItem.dataset.answerId = String(ans.id);

              const text = document.createElement('div');
              text.className = 'exam-answer-text';
              const preview = String(ans.text ?? '').trim();
              const imgCount = Array.isArray(ans.images) ? ans.images.length : 0;
              text.textContent = preview ? preview : (imgCount ? '(solo imágenes)' : '');
              ansItem.appendChild(text);

              const meta = document.createElement('div');
              meta.className = 'exam-answer-meta';
              meta.textContent = imgCount ? `Imágenes: ${imgCount}` : '';
              ansItem.appendChild(meta);

              if (imgCount) {
                const thumbs = document.createElement('div');
                thumbs.className = 'answer-thumbs exam-answer-thumbs';
                thumbs.dataset.imageIds = JSON.stringify(ans.images ?? []);
                thumbs.dataset.limit = '3';
                ansItem.appendChild(thumbs);
              }

              const editBtn = document.createElement('button');
              editBtn.type = 'button';
              editBtn.className = 'btn btn-secondary btn-small exam-answer-edit-btn';
              editBtn.textContent = 'Editar';
              editBtn.dataset.categoryIndex = catIndex;
              editBtn.dataset.itemIndex = itemIndex;
              editBtn.dataset.questionId = String(q.id);
              editBtn.dataset.answerId = String(ans.id);
              ansItem.appendChild(editBtn);

              const delBtn = document.createElement('button');
              delBtn.type = 'button';
              delBtn.className = 'btn btn-secondary btn-small exam-answer-del-btn';
              delBtn.textContent = 'Eliminar';
              delBtn.dataset.categoryIndex = catIndex;
              delBtn.dataset.itemIndex = itemIndex;
              delBtn.dataset.questionId = String(q.id);
              delBtn.dataset.answerId = String(ans.id);
              ansItem.appendChild(delBtn);

              ansList.appendChild(ansItem);
            }
          }

          qBody.appendChild(ansList);
          qDetails.appendChild(qBody);
          qList.appendChild(qDetails);
        }
      }

      qaBody.appendChild(qList);
      details.appendChild(qaBody);
      li.appendChild(details);

      list.appendChild(li);
    });
    catDiv.appendChild(list);
    container.appendChild(catDiv);
  });

  // hydrate thumbnails (async, best-effort)
  queueMicrotask(() => {
    try {
      hydrateThumbs(container, '.exam-answer-thumbs');
    } catch {
      // ignore
    }
  });
}

export async function addExamCategory() {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectExams(subject);

  const name = await showPromptModal({
    title: "Nueva categoría",
    label: "Nombre de la categoría",
    placeholder: "Ej: Parciales",
    defaultValue: "Nueva categoría",
    confirmText: "Agregar",
    cancelText: "Cancelar"
  });
  if (name == null) return;

  subject.exams.push({ name: String(name).trim() || "Categoría", items: [] });
  saveData(true);
  renderExams();
}
export async function addExamItem(catIndex) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectExams(subject);
  const cat = subject.exams[catIndex];
  if (!cat) return;

  const title = await showPromptModal({
    title: "Nuevo examen",
    label: "Título del examen",
    placeholder: "Ej: Parcial 1",
    defaultValue: "Examen",
    confirmText: "Agregar",
    cancelText: "Cancelar"
  });
  if (title == null) return;

  const newItem = { title: String(title).trim() || "Examen", completed: false };
  cat.items = cat.items || [];
  cat.items.push(newItem);
  saveData(true);
  renderExams();
}
export function toggleExamCompleted(catIndex, itemIndex) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectExams(subject);
  const cat = subject.exams[catIndex];
  if (!cat) return;
  const item = (cat.items || [])[itemIndex];
  if (!item) return;
  item.completed = !item.completed;
  if (item.completed) {
    item.completedAt = Date.now();
    const diff = getDifficultyConfigForSubject(subject);
    const xp = diff?.xpExamComplete ?? diff?.xpTopicComplete ?? 0; // use exam xp if available
    const gained = awardXp(subject, xp, { reason: 'exam_complete' }) ?? 0;
    showNotification(`Examen completado! +${gained} XP`);
  } else {
    const diff = getDifficultyConfigForSubject(subject);
    const xp = diff?.xpExamComplete ?? diff?.xpTopicComplete ?? 0;
    // deduct xp when marking incomplete
    deductXp(subject, xp);
    showNotification(`XP revertida (-${xp})`);
  }
  saveData(true);
  renderExams();
  import('../../ui/render.mjs').then((mod) => mod.renderAllNonTimer());
}

export function attachExamFile(catIndex, itemIndex, file) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectExams(subject);
  const cat = subject.exams[catIndex];
  if (!cat) return;
  const item = (cat.items || [])[itemIndex];
  if (!item) return;

  const maxBytes = 700 * 1024; // localStorage quota safety
  if (file?.size && file.size > maxBytes) {
    showNotification('Archivo muy grande para adjuntar. Probá comprimirlo o guardarlo como link.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    item.attachment = reader.result;
    item.filename = file.name;
    saveData(true);
    renderExams();
  };
  reader.readAsDataURL(file);
}

export async function addExamQuestion(catIndex, itemIndex) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectExams(subject);
  const cat = subject.exams[catIndex];
  const item = (cat?.items || [])[itemIndex];
  if (!item) return;

  const q = await showPromptModal({
    title: 'Nueva pregunta',
    label: 'Pregunta',
    placeholder: 'Ej: ¿Qué es la caché?',
    defaultValue: '',
    confirmText: 'Agregar',
    cancelText: 'Cancelar'
  });
  if (q == null) return;

  if (!Array.isArray(item.questions)) item.questions = [];
  item.questions.push({
    id: `q_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    q: String(q).trim(),
    answers: []
  });

  saveData(true);
  renderExams();
}

export async function deleteExamQuestion(catIndex, itemIndex, questionId) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectExams(subject);
  const cat = subject.exams[catIndex];
  const item = (cat?.items || [])[itemIndex];
  if (!item) return;

  const id = String(questionId ?? '').trim();
  if (!id) return;

  const ok = await showConfirmModalV2({
    title: 'Eliminar pregunta',
    text: '¿Eliminar esta pregunta y todas sus respuestas?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    fallbackText: '¿Eliminar pregunta?'
  });
  if (!ok) return;

  const questions = Array.isArray(item.questions) ? item.questions : [];
  const q = questions.find((x) => String(x?.id ?? '') === id) ?? null;
  item.questions = questions.filter((x) => String(x?.id ?? '') !== id);
  saveData(true);
  renderExams();

  // Cleanup associated images (best-effort).
  const answers = Array.isArray(q?.answers) ? q.answers : [];
  for (const a of answers) {
    const imgs = Array.isArray(a?.images) ? a.images : [];
    for (const imgId of imgs) {
      try {
        await deleteImage(imgId);
      } catch {
        // ignore
      }
    }
  }
}
