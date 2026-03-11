/* SoundEnglish Homework App */
(function () {

    const LS_MODEL = 'se_model';
    const LS_CHAT  = 'se_chat_state';
    const API_BASE = 'https://generate-cqmoidoxkq-ew.a.run.app';
    let currentUser   = null;
    let students      = [];       // cached
    let homeworkTypes = [];       // cached template list
    let savedHomeworks = [];      // cached saved homeworks
    let lastOutput    = null;     // last generated text (ephemeral)
    let lastGenerateMeta = null;  // metadata for saving
    let masterPrompt  = null;     // editable master prompt (loaded from Firestore)

    // ---- Boot ----
    const waitForFirebase = setInterval(() => {
        if (typeof window.FirebaseService !== 'undefined') {
            clearInterval(waitForFirebase);
            window.FirebaseService.onAuthStateChanged(async (user) => {
                document.getElementById('authLoading').style.display = 'none';
                if (!user) { window.location.href = '../index.html'; return; }
                currentUser = user;
                document.getElementById('userEmail').textContent = user.email;
                document.getElementById('appShell').style.display = 'flex';
                await loadStudents();
                await loadHomeworkTypes();
                await loadHomeworks();
                await loadMasterPrompt();
                await populateModelDropdown();
                setupNav();
                setupGenerate();
                setupHomeworkTypes();
                setupStudents();
                setupMasterPrompt();
                setupHwDetailModal();
                restoreChatState();
                document.getElementById('signOutBtn').addEventListener('click', async () => {
                    await window.FirebaseService.signOut();
                    window.location.href = '../index.html';
                });
            });
        }
    }, 100);

    // ---- Navigation ----
    function setupNav() {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.section + 'Section').classList.add('active');
            });
        });
    }

    // ============================================================
    // STUDENTS — source of truth in Firestore
    // ============================================================
    async function loadStudents() {
        const result = await window.FirebaseService.getAllStudents();
        students = result.success ? result.data : [];
        renderStudents();
        populateChatStudentDropdown();
    }

    function renderStudents() {
        const grid  = document.getElementById('studentList');
        const empty = document.getElementById('studentsEmpty');
        grid.innerHTML = '';
        if (students.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';
        students.forEach(s => {
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div class="s-name">${escHtml(s.name)}</div>
                <div class="s-meta">
                    <span class="badge badge-level">${escHtml(s.level)}</span>
                    <span class="badge badge-lang">${escHtml(s.nativeLang)}</span>
                </div>
                ${s.themes ? `<div class="s-detail">${escHtml(s.themes)}</div>` : ''}
                ${s.focus  ? `<div class="s-detail">${escHtml(s.focus)}</div>`  : ''}
                ${s.notes  ? `<div class="s-detail">${escHtml(s.notes)}</div>`  : ''}
                <div class="card-actions">
                    <button class="btn-edit">Edit</button>
                    <button class="btn-danger">Delete</button>
                </div>
            `;
            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-edit') || e.target.closest('.btn-danger')) return;
                openStudentDetail(s);
            });
            card.querySelector('.btn-edit').addEventListener('click', () => openEditStudent(s));
            card.querySelector('.btn-danger').addEventListener('click', () => deleteStudent(s.id, s.name));
            grid.appendChild(card);
        });
    }

    function populateChatStudentDropdown() {
        const sel = document.getElementById('chatStudent');
        const prev = sel.value;
        while (sel.options.length > 1) sel.remove(1);
        students.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.level})`;
            sel.appendChild(opt);
        });
        if (prev) sel.value = prev;
    }

    function setupStudents() {
        document.getElementById('newStudentBtn').addEventListener('click', openNewStudent);
        document.getElementById('cancelStudentBtn').addEventListener('click', closeStudentForm);
        document.getElementById('cancelStudentBtnFooter').addEventListener('click', closeStudentForm);
        document.getElementById('saveStudentBtn').addEventListener('click', saveStudent);
        document.getElementById('studentModal').addEventListener('click', e => {
            if (e.target === document.getElementById('studentModal')) closeStudentForm();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && document.getElementById('studentModal').style.display !== 'none') closeStudentForm();
        });
    }

    function openNewStudent() {
        document.getElementById('studentFormTitle').textContent = 'Add Student';
        document.getElementById('studentId').value = '';
        document.getElementById('studentName').value = '';
        document.getElementById('studentNativeLang').value = 'French';
        document.getElementById('studentLevel').value = 'B2';
        document.getElementById('studentThemes').value = '';
        document.getElementById('studentFocus').value = '';
        document.getElementById('studentNotes').value = '';
        document.getElementById('studentModal').style.display = 'flex';
        document.getElementById('studentName').focus();
    }

    function openEditStudent(s) {
        document.getElementById('studentFormTitle').textContent = 'Edit — ' + s.name;
        document.getElementById('studentId').value = s.id;
        document.getElementById('studentName').value = s.name || '';
        document.getElementById('studentNativeLang').value = s.nativeLang || 'French';
        document.getElementById('studentLevel').value = s.level || 'B2';
        document.getElementById('studentThemes').value = s.themes || '';
        document.getElementById('studentFocus').value = s.focus || '';
        document.getElementById('studentNotes').value = s.notes || '';
        document.getElementById('studentModal').style.display = 'flex';
        document.getElementById('studentName').focus();
    }

    function closeStudentForm() {
        document.getElementById('studentModal').style.display = 'none';
    }

    async function saveStudent() {
        const name = document.getElementById('studentName').value.trim();
        if (!name) { alert('Please enter a student name.'); return; }
        const id = document.getElementById('studentId').value;
        const data = {
            name,
            nativeLang: document.getElementById('studentNativeLang').value,
            level:      document.getElementById('studentLevel').value,
            themes:     document.getElementById('studentThemes').value.trim(),
            focus:      document.getElementById('studentFocus').value.trim(),
            notes:      document.getElementById('studentNotes').value.trim(),
        };
        const btn = document.getElementById('saveStudentBtn');
        btn.disabled = true; btn.textContent = 'Saving…';
        const result = id
            ? await window.FirebaseService.updateStudent(id, data)
            : await window.FirebaseService.createStudent(data);
        btn.disabled = false; btn.textContent = 'Save';
        if (result.success) { closeStudentForm(); await loadStudents(); }
        else alert('Error: ' + result.error);
    }

    async function deleteStudent(id, name) {
        if (!confirm(`Delete student "${name}"?`)) return;
        const result = await window.FirebaseService.deleteStudent(id);
        if (result.success) await loadStudents();
        else alert('Error: ' + result.error);
    }

    // ============================================================
    // HOMEWORK TEMPLATES — library of exercise types in Firestore
    // ============================================================
    const DEFAULT_TEMPLATES = [
        {
            name: 'Gap Fill',
            prompt:
`## EXERCISE TYPE
Gap Fill (Cloze)

## CONTENT BALANCE
- 80% of the gaps must target vocabulary and structures introduced in the CURRENT lesson topic.
- 20% of the gaps should recycle vocabulary or structures from recent previous lessons to reinforce retention.

## WHAT TO DO
- Select 8-12 key words or phrases from the lesson text or topic.
- Remove each one and replace it with a numbered blank: __(1)__, __(2)__, etc.
- Keep the surrounding sentence natural and meaningful.
- Provide a shuffled WORD BANK at the top listing all the missing items.
- Provide a numbered ANSWER KEY at the end.

## WHAT NOT TO DO
- Do not remove grammatical function words (a, the, is, in…) unless the focus is grammar.
- Do not create two consecutive blanks in the same sentence.
- Do not make blanks so short that they are trivially easy or so long that they are impossible.
- Do not use markdown formatting (no asterisks, no bold, no bullet symbols) in the exercise itself — plain text only.

## EXAMPLE OUTPUT FORMAT
Word bank: negotiate, leverage, stakeholder, deadline, consensus

1. The project manager set a strict __(1)__ for the final report.
2. Before the meeting, each side tried to __(2)__ a fair deal.
3. It is important to identify every __(3)__ before launching the product.
...

Answer key:
1. deadline  2. negotiate  3. stakeholder  ...

## OTHER INSTRUCTIONS
- The output must be plain text only. Do not use any markdown formatting: no asterisks, no bold, no italics, no hash headings, no bullet symbols.
- Adapt sentence complexity and vocabulary to the student's level.
- Target completion time: 15-20 minutes.`
        },
        {
            name: 'Error Correction',
            prompt:
`## EXERCISE TYPE
Error Correction

## CONTENT BALANCE
- 80% of the errors must relate to grammar points, vocabulary, or collocations from the CURRENT lesson topic.
- 20% of the errors should revisit common mistakes linked to recent previous lessons.

## WHAT TO DO
- Write 8-10 complete sentences, each containing exactly ONE deliberate error.
- Errors may be: wrong verb tense, subject-verb agreement, wrong preposition, incorrect collocation, false friend, wrong word form, or article misuse.
- Number each sentence.
- Provide a corrected ANSWER KEY at the end, explaining what was wrong in one short phrase.

## WHAT NOT TO DO
- Do not put more than one error per sentence.
- Do not make the error so subtle it is impossible to find, or so obvious it requires no thought.
- Do not invent errors that are debatable or acceptable in informal English.
- Do not use markdown formatting in the exercise itself — plain text only.

## EXAMPLE OUTPUT FORMAT
1. She has been working in this company since three years.
2. The manager gave us a very useful advices before the presentation.
...

Answer key:
1. "since" → "for" (duration of time requires "for")
2. "advices" → "advice" (uncountable noun, no plural)
...

## OTHER INSTRUCTIONS
- The output must be plain text only. Do not use any markdown formatting: no asterisks, no bold, no italics, no hash headings, no bullet symbols.
- Adapt the difficulty of errors to the student's level.
- Target completion time: 15-20 minutes.`
        },
        {
            name: 'Vocabulary Matching',
            prompt:
`## EXERCISE TYPE
Vocabulary Matching (Two Columns)

## CONTENT BALANCE
- 80% of the target words must come from the CURRENT lesson topic.
- 20% should recycle key vocabulary from recent previous lessons.

## WHAT TO DO
- Create two columns with 8-10 items each.
- Column A: target words or expressions (numbered 1, 2, 3…).
- Column B: definitions, synonyms, or L1 equivalents (lettered A, B, C… and scrambled).
- Provide an ANSWER KEY at the end.

## WHAT NOT TO DO
- Do not make definitions so long they give away the answer too easily.
- Do not include two items in Column B that could plausibly match the same word in Column A.
- Do not use markdown formatting in the exercise itself — plain text only.

## EXAMPLE OUTPUT FORMAT
Column A                 Column B
1. to negotiate          A. the final date by which something must be done
2. a stakeholder         B. to reach a mutual agreement through discussion
3. a deadline            C. a person with an interest in a project or organisation
...

Answer key: 1-B  2-C  3-A  ...

## OTHER INSTRUCTIONS
- The output must be plain text only. Do not use any markdown formatting: no asterisks, no bold, no italics, no hash headings, no bullet symbols.
- Adapt vocabulary selection and definition complexity to the student's level.
- Target completion time: 10-15 minutes.`
        },
        {
            name: 'Translation',
            prompt:
`## EXERCISE TYPE
Translation (English → student's native language)

## CONTENT BALANCE
- 80% of the sentences must use vocabulary, collocations, or structures from the CURRENT lesson topic.
- 20% of the sentences should recycle expressions from recent previous lessons.

## WHAT TO DO
- Write 8-10 sentences in English that the student must translate into their native language.
- Choose sentences that highlight lesson-specific vocabulary and structures in a natural context.
- Vary sentence length and complexity across the exercise.
- Provide a MODEL TRANSLATION at the end (in the student's native language).

## WHAT NOT TO DO
- Do not use overly idiomatic English that has no natural translation.
- Do not write sentences so simple that they require no effort.
- Do not write sentences so long or complex that they become confusing.
- Do not use markdown formatting in the exercise itself — plain text only.

## EXAMPLE OUTPUT FORMAT
Translate the following sentences into [native language]:

1. The board of directors will meet next Thursday to review the quarterly results.
2. She managed to negotiate a better deal by focusing on long-term value.
...

Model translation:
1. [translation]
2. [translation]
...

## OTHER INSTRUCTIONS
- The output must be plain text only. Do not use any markdown formatting: no asterisks, no bold, no italics, no hash headings, no bullet symbols.
- Adapt sentence complexity to the student's level.
- For the model translation, use natural, idiomatic [native language] rather than a word-for-word rendering.
- Target completion time: 20-25 minutes.`
        },
    ];

    async function loadHomeworkTypes() {
        const result = await window.FirebaseService.getAllHomeworkTypes();
        homeworkTypes = result.success ? result.data : [];
        // Auto-reseed if empty or if prompts are the old single-line format
        const isOldFormat = homeworkTypes.length > 0 && !homeworkTypes[0].prompt.includes('## EXERCISE TYPE');
        if (homeworkTypes.length === 0 || isOldFormat) await seedDefaultTypes();
        renderHomeworkTypes();
        renderTypePills();
    }

    async function seedDefaultTypes() {
        // Delete any existing templates before re-seeding
        for (const t of homeworkTypes) {
            await window.FirebaseService.deleteHomeworkType(t.id);
        }
        for (const t of DEFAULT_TEMPLATES) {
            await window.FirebaseService.createHomeworkType(t);
        }
        const result = await window.FirebaseService.getAllHomeworkTypes();
        homeworkTypes = result.success ? result.data : [];
    }

    function renderHomeworkTypes() {
        const list  = document.getElementById('hwTypeList');
        const empty = document.getElementById('hwTypeEmpty');
        list.innerHTML = '';
        if (homeworkTypes.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';
        homeworkTypes.forEach(t => {
            const card = document.createElement('div');
            card.className = 'hw-type-card';
            card.innerHTML = `
                <div class="hwt-name">${escHtml(t.name)}</div>
                <div class="hwt-prompt">${escHtml(t.prompt)}</div>
                <div class="hwt-actions">
                    <button class="btn-edit">Edit</button>
                    <button class="btn-danger">Delete</button>
                </div>
            `;
            card.querySelector('.btn-edit').addEventListener('click', () => openEditHwType(t));
            card.querySelector('.btn-danger').addEventListener('click', () => deleteHwType(t.id, t.name));
            list.appendChild(card);
        });
    }

    function renderTypePills() {
        const container = document.getElementById('chatHwTypePills');
        // Preserve any existing selection; default = all selected
        let savedTypes = [];
        try { savedTypes = JSON.parse(localStorage.getItem(LS_CHAT) || '{}').types || []; } catch(e) {}
        container.innerHTML = '';
        homeworkTypes.forEach(t => {
            const pill = document.createElement('button');
            pill.type = 'button';
            // If nothing saved yet, all active; otherwise restore saved state
            const active = savedTypes.length === 0 || savedTypes.includes(t.id);
            pill.className = 'hw-pill' + (active ? '' : ' inactive');
            pill.textContent = t.name;
            pill.dataset.id = t.id;
            pill.addEventListener('click', () => {
                pill.classList.toggle('inactive');
                saveChatState();
            });
            container.appendChild(pill);
        });
    }

    function getSelectedTypeIds() {
        return [...document.querySelectorAll('#chatHwTypePills .hw-pill:not(.inactive)')]
            .map(p => p.dataset.id);
    }

    function setupHomeworkTypes() {
        document.getElementById('newHomeworkBtn').addEventListener('click', openNewHwType);
        document.getElementById('cancelHwTypeBtn').addEventListener('click', closeHwTypeForm);
        document.getElementById('cancelHwTypeBtnFooter').addEventListener('click', closeHwTypeForm);
        document.getElementById('saveHwTypeBtn').addEventListener('click', saveHwType);
        // Close on backdrop click
        document.getElementById('hwTypeModal').addEventListener('click', e => {
            if (e.target === document.getElementById('hwTypeModal')) closeHwTypeForm();
        });
        // Close on Escape key
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && document.getElementById('hwTypeModal').style.display !== 'none') closeHwTypeForm();
        });
    }

    function openNewHwType() {
        document.getElementById('hwTypeFormTitle').textContent = 'New exercise type';
        document.getElementById('hwTypeId').value      = '';
        document.getElementById('hwTypeName').value    = '';
        document.getElementById('hwTypePrompt').value  = '';
        document.getElementById('hwTypeModal').style.display = 'flex';
        document.getElementById('hwTypeName').focus();
    }

    function openEditHwType(t) {
        document.getElementById('hwTypeFormTitle').textContent = 'Edit — ' + t.name;
        document.getElementById('hwTypeId').value      = t.id;
        document.getElementById('hwTypeName').value    = t.name || '';
        document.getElementById('hwTypePrompt').value  = t.prompt || '';
        document.getElementById('hwTypeModal').style.display = 'flex';
        document.getElementById('hwTypeName').focus();
    }

    function closeHwTypeForm() {
        document.getElementById('hwTypeModal').style.display = 'none';
    }

    async function saveHwType() {
        const name   = document.getElementById('hwTypeName').value.trim();
        const prompt = document.getElementById('hwTypePrompt').value.trim();
        if (!name)   { alert('Please enter a name.'); return; }
        if (!prompt) { alert('Please enter a prompt.'); return; }
        const id  = document.getElementById('hwTypeId').value;
        const btn = document.getElementById('saveHwTypeBtn');
        btn.disabled = true; btn.textContent = 'Saving…';
        const result = id
            ? await window.FirebaseService.updateHomeworkType(id, { name, prompt })
            : await window.FirebaseService.createHomeworkType({ name, prompt });
        btn.disabled = false; btn.textContent = 'Save';
        if (result.success) { closeHwTypeForm(); await loadHomeworkTypes(); }
        else alert('Error: ' + result.error);
    }

    async function deleteHwType(id, name) {
        if (!confirm(`Delete template "${name}"?`)) return;
        const result = await window.FirebaseService.deleteHomeworkType(id);
        if (result.success) await loadHomeworkTypes();
        else alert('Error: ' + result.error);
    }

    // ---- Model dropdown — curated list (calls go through Cloud Function → Vertex AI) ----
    const AVAILABLE_MODELS = [
        { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro (Best)' },
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
        { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ];

    function populateModelDropdown() {
        const sel = document.getElementById('modelSelect');
        sel.innerHTML = '';
        AVAILABLE_MODELS.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.label;
            sel.appendChild(opt);
        });
        const saved = localStorage.getItem(LS_MODEL);
        if (saved && [...sel.options].some(o => o.value === saved)) { sel.value = saved; }
    }

    // ============================================================
    // GENERATE — Gemini API, state in localStorage
    // ============================================================
    function setupGenerate() {
        document.getElementById('modelSelect').addEventListener('change', e => {
            localStorage.setItem(LS_MODEL, e.target.value);
        });

        document.getElementById('chatStudent').addEventListener('change', () => {
            updateStudentPreview();
            saveChatState();
        });
        document.getElementById('chatTopic').addEventListener('input', saveChatState);

        document.getElementById('generateBtn').addEventListener('click', generate);
        document.getElementById('copyBtn').addEventListener('click', copyOutput);
        document.getElementById('saveHwBtn').addEventListener('click', saveHomework);
    }

    function restoreChatState() {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_CHAT) || '{}');
            if (saved.topic) document.getElementById('chatTopic').value = saved.topic;
            // student restored after dropdown is populated
            if (saved.student) {
                const sel = document.getElementById('chatStudent');
                const check = () => {
                    if ([...sel.options].some(o => o.value === saved.student)) {
                        sel.value = saved.student;
                        updateStudentPreview();
                    }
                };
                // Try immediately (students already loaded) or after a tick
                setTimeout(check, 50);
            }
        } catch (e) {}
    }

    function saveChatState() {
        localStorage.setItem(LS_CHAT, JSON.stringify({
            student: document.getElementById('chatStudent').value,
            types:   getSelectedTypeIds(),
            topic:   document.getElementById('chatTopic').value,
        }));
    }

    function updateStudentPreview() {
        const id      = document.getElementById('chatStudent').value;
        const preview = document.getElementById('studentPreview');
        const s       = students.find(st => st.id === id);
        if (!s) { preview.style.display = 'none'; return; }
        preview.style.display = 'block';
        preview.innerHTML =
            `<strong>${escHtml(s.name)}</strong> &middot; ${escHtml(s.level)} &middot; Native: ${escHtml(s.nativeLang)}`
            + (s.themes ? `<br>${escHtml(s.themes)}` : '')
            + (s.focus  ? `<br><em>Focus: ${escHtml(s.focus)}</em>` : '');
    }

    async function generate(retryCount = 0) {
        const topic = document.getElementById('chatTopic').value.trim();
        if (!topic) { alert('Please describe the lesson topic.'); return; }

        const modelId   = document.getElementById('modelSelect').value;
        const typeIds   = getSelectedTypeIds();
        if (typeIds.length === 0) { alert('Please select at least one exercise type.'); return; }
        const templates = typeIds.map(id => homeworkTypes.find(t => t.id === id)).filter(Boolean);
        const sId       = document.getElementById('chatStudent').value;
        const s         = students.find(st => st.id === sId);

        const btn = document.getElementById('generateBtn');
        btn.disabled = true; btn.textContent = 'Generating…';
        document.getElementById('outputActions').style.display = 'none';
        const outputEl = document.getElementById('outputContent');
        outputEl.textContent = '';
        document.getElementById('outputLoading').style.display = 'flex';

        try {
            const prompt = buildPrompt(topic, templates, s);
            const token  = await currentUser.getIdToken();

            const response = await fetch(API_BASE + '/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                body: JSON.stringify({ prompt, model: modelId }),
            });

            if (!response.ok) {
                let msg = 'HTTP ' + response.status;
                try { const j = await response.json(); msg = j.error || msg; } catch {}
                throw new Error(msg);
            }

            // Read streaming SSE response
            document.getElementById('outputLoading').style.display = 'none';
            outputEl.textContent = '';
            let fullText = '';
            const reader  = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop();           // keep incomplete last line

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.error) throw new Error(parsed.error);
                        if (parsed.text) {
                            fullText += parsed.text;
                            outputEl.textContent = fullText;
                        }
                    } catch (parseErr) {
                        if (parseErr.message !== 'Unexpected end of JSON input') throw parseErr;
                    }
                }
            }
            showOutput(fullText);
            // Store metadata for the Save button
            lastGenerateMeta = {
                studentId: sId || null,
                studentName: s ? s.name : null,
                typeNames: templates.map(t => t.name),
                topic: topic,
                model: modelId,
            };
        } catch (err) {
            document.getElementById('outputLoading').style.display = 'none';
            const isQuota = /quota|billing|RESOURCE_EXHAUSTED/i.test(err.message);
            const isRate  = /429|rate.limit/i.test(err.message);

            if (isRate && retryCount < 3) {
                const waitMs = 1500 * (retryCount + 1);
                btn.textContent = `Retrying in ${Math.ceil(waitMs / 1000)}s…`;
                await new Promise(r => setTimeout(r, waitMs));
                btn.disabled = false;
                return generate(retryCount + 1);
            }

            const e    = new Error(err.message);
            e.isQuota  = isQuota;
            showError(e);
        } finally {
            btn.disabled = false; btn.textContent = 'Generate';
        }
    }

    function showOutput(text) {
        lastOutput = text;
        document.getElementById('outputContent').textContent = text;
        document.getElementById('outputLoading').style.display = 'none';
        document.getElementById('outputActions').style.display = 'flex';
        document.getElementById('copyBtn').textContent = 'Copy';
    }

    function showError(err) {
        const box = document.getElementById('outputContent');
        if (err.isQuota) {
            box.innerHTML = `<div class="output-error">
                <strong>Quota / billing limit reached</strong>
                <p>Your Gemini API key has hit its free-tier limit (limit = 0).
                   This means the Google Cloud project attached to the key needs
                   billing to be enabled before it can make API calls.</p>
                <ol>
                    <li>Go to <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener">Google Cloud Billing</a> and link a billing account to project <strong>soundenglish-homework</strong>.</li>
                    <li>Then go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio → API keys</a> and confirm the key is active.</li>
                    <li>Reload this page and try again.</li>
                </ol>
                <details><summary>Raw error</summary><pre>${escHtml(err.message)}</pre></details>
            </div>`;
        } else {
            box.innerHTML = `<div class="output-error"><strong>Error</strong><pre>${escHtml(err.message)}</pre></div>`;
        }
    }

    function copyOutput() {
        if (!lastOutput) return;
        navigator.clipboard.writeText(lastOutput).then(() => {
            const btn = document.getElementById('copyBtn');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
        });
    }

    const DEFAULT_MASTER_PROMPT =
`You are an experienced English language teacher creating homework exercises.

## LESSON NOTES HANDLING
- The lesson notes may contain **bold** words or sentences. These are the KEY items the teacher wants to reinforce — give them significantly more weight when building exercises.
- Vocabulary and structures marked in bold should appear in the majority of exercise items.
- Non-bold content provides supporting context but should not be the primary focus of exercise items.
- Do not over-test prepositions or function words (a, the, in, on, at…) unless they were explicitly highlighted in bold or are the stated grammar focus.
- When the lesson notes contain no bold markers, treat all vocabulary and structures equally.`;

    async function loadMasterPrompt() {
        const result = await window.FirebaseService.getMasterPrompt();
        masterPrompt = (result.success && result.data) ? result.data : DEFAULT_MASTER_PROMPT;
        renderMasterPromptPreview();
    }

    function renderMasterPromptPreview() {
        const pre = document.getElementById('masterPromptPreview');
        if (pre) pre.textContent = masterPrompt;
    }

    function setupMasterPrompt() {
        document.getElementById('editMasterPromptBtn').addEventListener('click', () => {
            document.getElementById('masterPromptTextarea').value = masterPrompt;
            document.getElementById('masterPromptDisplay').style.display = 'none';
            document.getElementById('masterPromptEdit').style.display = 'block';
        });
        document.getElementById('cancelMasterPromptBtn').addEventListener('click', () => {
            document.getElementById('masterPromptEdit').style.display = 'none';
            document.getElementById('masterPromptDisplay').style.display = 'block';
        });
        document.getElementById('resetMasterPromptBtn').addEventListener('click', () => {
            document.getElementById('masterPromptTextarea').value = DEFAULT_MASTER_PROMPT;
        });
        document.getElementById('saveMasterPromptBtn').addEventListener('click', async () => {
            const text = document.getElementById('masterPromptTextarea').value.trim();
            if (!text) { alert('The master prompt cannot be empty.'); return; }
            const btn = document.getElementById('saveMasterPromptBtn');
            btn.disabled = true; btn.textContent = 'Saving…';
            const result = await window.FirebaseService.saveMasterPrompt(text);
            btn.disabled = false; btn.textContent = 'Save';
            if (result.success) {
                masterPrompt = text;
                renderMasterPromptPreview();
                document.getElementById('masterPromptEdit').style.display = 'none';
                document.getElementById('masterPromptDisplay').style.display = 'block';
            } else {
                alert('Error: ' + result.error);
            }
        });
    }

    function buildPrompt(topic, templates, student) {
        const multi = templates.length > 1;
        let prompt = masterPrompt + '\n\n';

        if (student) {
            prompt += '## STUDENT PROFILE\n';
            prompt += `- Name: ${student.name}\n`;
            prompt += `- Level: ${student.level}\n`;
            prompt += `- Native language: ${student.nativeLang}\n`;
            if (student.themes) prompt += `- Themes / interests: ${student.themes}\n`;
            if (student.focus)  prompt += `- Grammar / skills focus: ${student.focus}\n`;
            if (student.notes)  prompt += `- Other notes: ${student.notes}\n`;
            prompt += '\n';
        }

        prompt += `## LESSON NOTES\n${topic}\n\n`;

        if (multi) {
            prompt += `## TASK\nProduce ${templates.length} separate exercises based on the lesson notes above, `
                + `one for each section below. Separate each exercise with this exact divider:\n`
                + `========================================\n\n`;
            templates.forEach((t, i) => {
                prompt += `### EXERCISE ${i + 1}: ${escHtml(t.name)}\n${t.prompt}\n\n`;
            });
        } else {
            prompt += `## EXERCISE INSTRUCTIONS\n${templates[0].prompt}\n\n`;
        }

        prompt += '## OUTPUT FORMAT\n';
        prompt += '- Plain text only in the exercise body. No markdown asterisks, hash signs, or bullet symbols.\n';
        prompt += '- Use clear numbered items throughout.\n';
        if (student?.nativeLang) {
            prompt += `- The student\'s native language is ${student.nativeLang} — keep this in mind for translation exercises and for anticipating typical errors.\n`;
        }
        prompt += '- Adapt vocabulary and difficulty precisely to the student\'s level.\n';

        return prompt;
    }

    // ============================================================
    // SAVED HOMEWORKS
    // ============================================================
    async function loadHomeworks() {
        const result = await window.FirebaseService.getAllHomeworks();
        savedHomeworks = result.success ? result.data : [];
        renderSavedHomeworks();
    }

    function renderSavedHomeworks() {
        const list  = document.getElementById('savedHwList');
        const empty = document.getElementById('savedHwEmpty');
        list.innerHTML = '';
        if (savedHomeworks.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';
        savedHomeworks.forEach(hw => {
            list.appendChild(buildHwRow(hw));
        });
    }

    function buildHwRow(hw) {
        const row = document.createElement('div');
        row.className = 'saved-hw-row';
        const date = hw.createdAt ? new Date(hw.createdAt.seconds * 1000) : new Date();
        const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const types = (hw.typeNames || []).map(n => `<span class="badge">${escHtml(n)}</span>`).join('');
        const preview = (hw.content || '').slice(0, 120).replace(/\n/g, ' ');
        row.innerHTML = `
            <div class="saved-hw-date">${dateStr}</div>
            <div class="saved-hw-student">${escHtml(hw.studentName || '—')}</div>
            <div class="saved-hw-types">${types}</div>
            <div class="saved-hw-preview">${escHtml(preview)}</div>
        `;
        row.addEventListener('click', () => openHwDetail(hw));
        return row;
    }

    async function saveHomework() {
        if (!lastOutput || !lastGenerateMeta) return;
        const btn = document.getElementById('saveHwBtn');
        btn.disabled = true; btn.textContent = 'Saving…';
        const result = await window.FirebaseService.createHomework({
            content: lastOutput,
            studentId: lastGenerateMeta.studentId,
            studentName: lastGenerateMeta.studentName,
            typeNames: lastGenerateMeta.typeNames,
            topic: lastGenerateMeta.topic,
            model: lastGenerateMeta.model,
        });
        btn.disabled = false; btn.textContent = 'Saved!';
        setTimeout(() => { btn.textContent = 'Save'; }, 2000);
        if (result.success) {
            await loadHomeworks();
        } else {
            alert('Error saving: ' + result.error);
            btn.textContent = 'Save';
        }
    }

    // ---- Homework detail modal ----
    function setupHwDetailModal() {
        document.getElementById('hwDetailModal').addEventListener('click', e => {
            if (e.target === document.getElementById('hwDetailModal')) {
                document.getElementById('hwDetailModal').style.display = 'none';
            }
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && document.getElementById('hwDetailModal').style.display !== 'none') {
                document.getElementById('hwDetailModal').style.display = 'none';
            }
        });
    }

    function openHwDetail(hw) {
        const date = hw.createdAt ? new Date(hw.createdAt.seconds * 1000) : new Date();
        const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const types = (hw.typeNames || []).join(', ');
        document.getElementById('hwDetailTitle').textContent = hw.studentName ? hw.studentName + ' — ' + dateStr : dateStr;
        document.getElementById('hwDetailMeta').innerHTML =
            `<strong>Types:</strong> ${escHtml(types)}<br>`
            + `<strong>Topic:</strong> ${escHtml((hw.topic || '').slice(0, 200))}`;
        document.getElementById('hwDetailContent').textContent = hw.content || '';
        document.getElementById('hwDetailModal').style.display = 'flex';

        // Wire up buttons each time (simpler than persistent listeners with changing hw ref)
        const closeBtn = document.getElementById('closeHwDetailBtn');
        const copyBtn  = document.getElementById('copyHwDetailBtn');
        const delBtn   = document.getElementById('deleteHwDetailBtn');
        closeBtn.onclick = () => { document.getElementById('hwDetailModal').style.display = 'none'; };
        copyBtn.onclick  = () => {
            navigator.clipboard.writeText(hw.content || '').then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
            });
        };
        delBtn.onclick = async () => {
            if (!confirm('Delete this saved homework?')) return;
            const res = await window.FirebaseService.deleteHomework(hw.id);
            if (res.success) {
                document.getElementById('hwDetailModal').style.display = 'none';
                await loadHomeworks();
                // Refresh student detail view if open
                const detailView = document.getElementById('studentDetailView');
                if (detailView.style.display !== 'none') {
                    const s = students.find(st => st.id === hw.studentId);
                    if (s) openStudentDetail(s);
                }
            }
        };
    }

    // ============================================================
    // STUDENT DETAIL VIEW
    // ============================================================
    async function openStudentDetail(s) {
        document.getElementById('studentListView').style.display = 'none';
        const view = document.getElementById('studentDetailView');
        view.style.display = 'block';

        // Render student info card
        const card = document.getElementById('studentDetailCard');
        card.innerHTML = `
            <div class="s-name">${escHtml(s.name)}</div>
            <div class="s-meta">
                <span class="badge badge-level">${escHtml(s.level)}</span>
                <span class="badge badge-lang">${escHtml(s.nativeLang)}</span>
            </div>
            ${s.themes ? `<div class="s-detail"><strong>Themes:</strong> ${escHtml(s.themes)}</div>` : ''}
            ${s.focus  ? `<div class="s-detail"><strong>Focus:</strong> ${escHtml(s.focus)}</div>`  : ''}
            ${s.notes  ? `<div class="s-detail"><strong>Notes:</strong> ${escHtml(s.notes)}</div>`  : ''}
            <div class="card-actions">
                <button class="btn-edit">Edit</button>
                <button class="btn-danger">Delete</button>
            </div>
        `;
        card.querySelector('.btn-edit').addEventListener('click', () => openEditStudent(s));
        card.querySelector('.btn-danger').addEventListener('click', async () => {
            await deleteStudent(s.id, s.name);
            closeStudentDetail();
        });

        // Fetch homeworks for this student
        const hwList = document.getElementById('studentHwList');
        const hwEmpty = document.getElementById('studentHwEmpty');
        hwList.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;">Loading…</div>';
        hwEmpty.style.display = 'none';

        const result = await window.FirebaseService.getHomeworksByStudent(s.id);
        const hws = result.success ? result.data : [];
        hwList.innerHTML = '';
        if (hws.length === 0) {
            hwEmpty.style.display = 'block';
        } else {
            hwEmpty.style.display = 'none';
            hws.forEach(hw => hwList.appendChild(buildHwRow(hw)));
        }

        // Back button
        document.getElementById('backToStudentsBtn').onclick = closeStudentDetail;
    }

    function closeStudentDetail() {
        document.getElementById('studentDetailView').style.display = 'none';
        document.getElementById('studentListView').style.display = 'block';
    }

    function escHtml(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

})();
