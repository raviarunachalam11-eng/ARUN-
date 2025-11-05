// Study page logic
const DEFAULT_SUBJECTS = [
    'Tamil', 'History', 'TN History', 'Economics', 'Polity',
    'Geography', 'Science', 'Current Affairs', 'English', 'General Knowledge'
];

let SUBJECTS = [...DEFAULT_SUBJECTS];

let currentSubject = null;
let editingId = null;
let deleteId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const userId = requireAuth();
    if (!userId) return;

    await db.init();

    // Load custom subjects
    const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
    SUBJECTS = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];

    const subjectList = document.getElementById('subject-list');
    const subjectDetail = document.getElementById('subject-detail');
    const backToSubjects = document.getElementById('back-to-subjects');
    const topicForm = document.getElementById('topic-form');
    const recordsList = document.getElementById('records-list');
    const confirmDialog = document.getElementById('confirm-dialog');
    const confirmOk = document.getElementById('confirm-ok');
    const confirmCancel = document.getElementById('confirm-cancel');
    const cancelBtn = document.getElementById('cancel-btn');
    const manageSubjectsBtn = document.getElementById('manage-subjects-btn');
    const manageSubjectsModal = document.getElementById('manage-subjects-modal');
    const closeManageModal = document.getElementById('close-manage-modal');
    const addSubjectForm = document.getElementById('add-subject-form');
    const subjectsManageList = document.getElementById('subjects-manage-list');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const addSubjectFormContainer = document.getElementById('add-subject-form-container');
    const quickAddSubjectForm = document.getElementById('quick-add-subject-form');
    const cancelAddSubject = document.getElementById('cancel-add-subject');

    // Quick add subject
    addSubjectBtn.addEventListener('click', () => {
        addSubjectFormContainer.style.display = 'block';
        document.getElementById('quick-subject-name').focus();
    });

    cancelAddSubject.addEventListener('click', () => {
        addSubjectFormContainer.style.display = 'none';
        quickAddSubjectForm.reset();
    });

    quickAddSubjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectName = document.getElementById('quick-subject-name').value.trim();
        
        if (!subjectName) return;

        // Check if subject already exists
        if (SUBJECTS.includes(subjectName)) {
            alert('Subject already exists!');
            return;
        }

        try {
            await db.add('customSubjects', {
                userId,
                name: subjectName
            });

            // Reload subjects
            const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
            SUBJECTS = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];
            
            quickAddSubjectForm.reset();
            addSubjectFormContainer.style.display = 'none';
            renderSubjects();
            alert('Subject added successfully!');
        } catch (error) {
            console.error('Error adding subject:', error);
            alert('Failed to add subject');
        }
    });

    // Manage subjects
    manageSubjectsBtn.addEventListener('click', () => {
        manageSubjectsModal.style.display = 'flex';
        loadSubjectsManageList();
    });

    closeManageModal.addEventListener('click', () => {
        manageSubjectsModal.style.display = 'none';
    });

    manageSubjectsModal.addEventListener('click', (e) => {
        if (e.target === manageSubjectsModal) {
            manageSubjectsModal.style.display = 'none';
        }
    });

    addSubjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectName = document.getElementById('new-subject-name').value.trim();
        
        if (!subjectName) return;

        // Check if subject already exists
        if (SUBJECTS.includes(subjectName)) {
            alert('Subject already exists!');
            return;
        }

        await db.add('customSubjects', {
            userId,
            name: subjectName
        });

        // Reload subjects
        const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
        SUBJECTS = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];
        
        document.getElementById('new-subject-name').value = '';
        loadSubjectsManageList();
        renderSubjects().catch(console.error);
    });

    async function loadSubjectsManageList() {
        const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
        const allSubjects = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];

        subjectsManageList.innerHTML = allSubjects.map((subject, index) => {
            const isCustom = index >= DEFAULT_SUBJECTS.length;
            const subjectId = isCustom ? customSubjects[index - DEFAULT_SUBJECTS.length].id : null;
            
            return `
                <div class="item-row">
                    <span>${subject}</span>
                    ${isCustom ? `
                        <div class="item-row-actions">
                            <button onclick="editStudySubject(${subjectId}, '${subject.replace(/'/g, "\\'")}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 14px;">Edit</button>
                            <button onclick="deleteStudySubject(${subjectId})" class="btn btn-danger" style="padding: 6px 12px; font-size: 14px;">Remove</button>
                        </div>
                    ` : '<span class="batch-badge">Default</span>'}
                </div>
            `;
        }).join('');
    }

    window.editStudySubject = async (id, currentName) => {
        const newName = prompt('Enter new subject name:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            try {
                // Check if new name already exists
                const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
                const allSubjects = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];
                if (allSubjects.includes(newName.trim())) {
                    alert('Subject name already exists!');
                    return;
                }

                await db.update('customSubjects', id, {
                    userId,
                    name: newName.trim()
                });

                // Reload subjects
                const updatedSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
                SUBJECTS = [...DEFAULT_SUBJECTS, ...updatedSubjects.map(s => s.name)];
                loadSubjectsManageList();
                renderSubjects().catch(console.error);
            } catch (error) {
                console.error('Error updating subject:', error);
                alert('Failed to update subject');
            }
        }
    };

    window.deleteStudySubject = async (id) => {
        if (!confirm('Are you sure you want to delete this subject? All study records for this subject will remain but you won\'t see it in the list.')) return;
        
        try {
            await db.delete('customSubjects', id);
            const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
            SUBJECTS = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];
            loadSubjectsManageList();
            renderSubjects().catch(console.error);
        } catch (error) {
            console.error('Error deleting subject:', error);
            alert('Failed to delete subject');
        }
    };

    // Quick add subject
    addSubjectBtn.addEventListener('click', () => {
        addSubjectFormContainer.style.display = 'block';
        document.getElementById('quick-subject-name').focus();
    });

    cancelAddSubject.addEventListener('click', () => {
        addSubjectFormContainer.style.display = 'none';
        quickAddSubjectForm.reset();
    });

    quickAddSubjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectName = document.getElementById('quick-subject-name').value.trim();
        
        if (!subjectName) return;

        // Check if subject already exists
        if (SUBJECTS.includes(subjectName)) {
            alert('Subject already exists!');
            return;
        }

        try {
            await db.add('customSubjects', {
                userId,
                name: subjectName
            });

            // Reload subjects
            const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
            SUBJECTS = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];
            
            quickAddSubjectForm.reset();
            addSubjectFormContainer.style.display = 'none';
            renderSubjects();
            alert('Subject added successfully!');
        } catch (error) {
            console.error('Error adding subject:', error);
            alert('Failed to add subject');
        }
    });

    // Render subject list with CRUD options
    async function renderSubjects() {
        const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId).catch(() => []);
        const customSubjectMap = new Map(customSubjects.map(s => [s.name, s.id]));
        
        subjectList.innerHTML = SUBJECTS.map(subject => {
            const isCustom = customSubjectMap.has(subject);
            const subjectId = isCustom ? customSubjectMap.get(subject) : null;
            
            return `
                <div class="subject-card-wrapper">
                    <div class="subject-card" onclick="openSubject('${subject}')">
                        <h3>${subject}</h3>
                        ${isCustom ? '<span class="batch-badge" style="position: absolute; top: 8px; left: 8px; font-size: 10px;">Custom</span>' : ''}
                    </div>
                    ${isCustom ? `
                        <div class="subject-card-actions">
                            <button onclick="event.stopPropagation(); editSubjectQuick(${subjectId}, '${subject.replace(/'/g, "\\'")}')" class="btn btn-primary" title="Edit" style="padding: 4px 8px; font-size: 12px;">✏️</button>
                            <button onclick="event.stopPropagation(); deleteSubjectQuick(${subjectId}, '${subject.replace(/'/g, "\\'")}')" class="btn btn-danger" title="Delete" style="padding: 4px 8px; font-size: 12px;">🗑️</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    window.editSubjectQuick = async (id, currentName) => {
        const newName = prompt('Enter new subject name:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            try {
                // Check if new name already exists
                const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
                const allSubjects = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];
                if (allSubjects.includes(newName.trim())) {
                    alert('Subject name already exists!');
                    return;
                }

                await db.update('customSubjects', id, {
                    userId,
                    name: newName.trim()
                });

                // Reload subjects
                const updatedSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
                SUBJECTS = [...DEFAULT_SUBJECTS, ...updatedSubjects.map(s => s.name)];
                renderSubjects().catch(console.error);
                alert('Subject updated successfully!');
            } catch (error) {
                console.error('Error updating subject:', error);
                alert('Failed to update subject');
            }
        }
    };

    window.deleteSubjectQuick = async (id, subjectName) => {
        if (!confirm(`Are you sure you want to delete "${subjectName}"? All study records for this subject will remain but you won't see it in the list.`)) return;
        
        try {
            await db.delete('customSubjects', id);
            const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
            SUBJECTS = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];
            renderSubjects().catch(console.error);
            alert('Subject deleted successfully!');
        } catch (error) {
            console.error('Error deleting subject:', error);
            alert('Failed to delete subject');
        }
    };

    window.openSubject = (subject) => {
        currentSubject = subject;
        document.getElementById('subject-title').textContent = subject;
        subjectList.style.display = 'none';
        subjectDetail.style.display = 'block';
        loadRecords();
    };

    backToSubjects.addEventListener('click', () => {
        currentSubject = null;
        editingId = null;
        subjectList.style.display = 'grid';
        subjectDetail.style.display = 'none';
        topicForm.reset();
        document.getElementById('form-title').textContent = 'Add New Topic';
        document.getElementById('submit-btn').textContent = 'Add';
        cancelBtn.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        editingId = null;
        topicForm.reset();
        document.getElementById('study-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('form-title').textContent = 'Add New Topic';
        document.getElementById('submit-btn').textContent = 'Add';
        cancelBtn.style.display = 'none';
    });

    // Set default date
    document.getElementById('study-date').value = new Date().toISOString().split('T')[0];

    topicForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const date = document.getElementById('study-date').value;
        const topic = document.getElementById('study-topic').value;
        const pages = parseInt(document.getElementById('study-pages').value);
        const revisionDate = document.getElementById('revision-date').value || null;

        const recordData = {
            userId,
            subject: currentSubject,
            date,
            topic,
            pages,
            revisionDate
        };

        try {
            if (editingId) {
                await db.update('studyRecords', editingId, recordData);
            } else {
                await db.add('studyRecords', recordData);
            }

            topicForm.reset();
            document.getElementById('study-date').value = new Date().toISOString().split('T')[0];
            editingId = null;
            document.getElementById('form-title').textContent = 'Add New Topic';
            document.getElementById('submit-btn').textContent = 'Add';
            cancelBtn.style.display = 'none';
            loadRecords();
        } catch (error) {
            console.error('Error saving record:', error);
            alert('Failed to save record');
        }
    });

    async function loadRecords() {
        if (!currentSubject) return;

        const allRecords = await db.getAllByIndex('studyRecords', 'userId', userId);
        const records = allRecords
            .filter(r => r.subject === currentSubject)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (records.length === 0) {
            recordsList.innerHTML = '<p style="color: #6b7280;">No study records yet. Add your first topic!</p>';
            return;
        }

        recordsList.innerHTML = records.map(record => `
            <div class="record-item">
                <div class="record-header">
                    <div class="record-title">${record.topic}</div>
                    <div class="record-actions">
                        <button class="btn btn-primary" onclick="editRecord(${record.id})" title="Edit">✏️ Edit</button>
                        <button class="btn btn-danger" onclick="deleteRecord(${record.id})" title="Delete">🗑️ Delete</button>
                    </div>
                </div>
                <div class="record-details">
                    <div><strong>Date:</strong> ${new Date(record.date).toLocaleDateString()}</div>
                    <div><strong>Pages:</strong> ${record.pages}</div>
                    ${record.revisionDate ? `<div class="revision-date"><strong>Revision:</strong> ${new Date(record.revisionDate).toLocaleDateString()}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    window.editRecord = (id) => {
        db.get('studyRecords', id).then(record => {
            editingId = id;
            document.getElementById('study-date').value = record.date;
            document.getElementById('study-topic').value = record.topic;
            document.getElementById('study-pages').value = record.pages;
            document.getElementById('revision-date').value = record.revisionDate || '';
            document.getElementById('form-title').textContent = 'Edit Topic';
            document.getElementById('submit-btn').textContent = 'Update';
            cancelBtn.style.display = 'inline-block';
        });
    };

    window.deleteRecord = (id) => {
        deleteId = id;
        confirmDialog.style.display = 'flex';
    };

    confirmOk.addEventListener('click', async () => {
        if (deleteId) {
            try {
                await db.delete('studyRecords', deleteId);
                deleteId = null;
                confirmDialog.style.display = 'none';
                loadRecords();
            } catch (error) {
                console.error('Error deleting record:', error);
                alert('Failed to delete record');
            }
        }
    });

    confirmCancel.addEventListener('click', () => {
        deleteId = null;
        confirmDialog.style.display = 'none';
    });

    // Initial render
    renderSubjects().catch(console.error);
});

