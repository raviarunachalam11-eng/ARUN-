// Dashboard page logic
const DEFAULT_SUBJECTS = [
    'Tamil', 'History', 'TN History', 'Economics', 'Polity',
    'Geography', 'Science', 'Current Affairs', 'English', 'General Knowledge'
];

document.addEventListener('DOMContentLoaded', async () => {
    const userId = requireAuth();
    if (!userId) return;

    await db.init();

    const logoutBtn = document.getElementById('logout-btn');
    const exportBtn = document.getElementById('export-btn');
    const importInput = document.getElementById('import-input');
    const messageArea = document.getElementById('message-area');
    const manageSubjectsBtn = document.getElementById('manage-subjects-btn');
    const manageSubjectsModal = document.getElementById('manage-subjects-modal');
    const closeManageModal = document.getElementById('close-manage-modal');
    const addSubjectForm = document.getElementById('add-subject-form');
    const subjectsList = document.getElementById('subjects-list');

    logoutBtn.addEventListener('click', () => {
        logout();
        window.location.href = 'index.html';
    });

    manageSubjectsBtn.addEventListener('click', () => {
        manageSubjectsModal.style.display = 'flex';
        loadSubjects();
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
        const existingSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
        const allSubjects = [...DEFAULT_SUBJECTS, ...existingSubjects.map(s => s.name)];
        
        if (allSubjects.includes(subjectName)) {
            showMessage('Subject already exists!', 'error');
            return;
        }

        await db.add('customSubjects', {
            userId,
            name: subjectName
        });

        document.getElementById('new-subject-name').value = '';
        loadSubjects();
        showMessage('Subject added successfully!', 'success');
    });

    async function loadSubjects() {
        const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
        const allSubjects = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];

        subjectsList.innerHTML = allSubjects.map((subject, index) => {
            const isCustom = index >= DEFAULT_SUBJECTS.length;
            const subjectId = isCustom ? customSubjects[index - DEFAULT_SUBJECTS.length].id : null;
            
            return `
                <div class="item-row">
                    <span>${subject}</span>
                    ${isCustom ? `
                        <div class="item-row-actions">
                            <button onclick="deleteSubject(${subjectId})" class="btn btn-danger" style="padding: 6px 12px; font-size: 14px;">Delete</button>
                        </div>
                    ` : '<span class="batch-badge">Default</span>'}
                </div>
            `;
        }).join('');
    }

    window.deleteSubject = async (id) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;
        
        try {
            await db.delete('customSubjects', id);
            loadSubjects();
            showMessage('Subject deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting subject:', error);
            showMessage('Failed to delete subject', 'error');
        }
    };

    exportBtn.addEventListener('click', async () => {
        try {
            const studyRecords = await db.getAllByIndex('studyRecords', 'userId', userId);
            const tests = await db.getAllByIndex('tests', 'userId', userId);
            const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
            const testBatches = await db.getAllByIndex('testBatches', 'userId', userId);
            
            // Get all test subjects
            const testSubjects = [];
            for (const test of tests) {
                const subjects = await db.getAllByIndex('testSubjects', 'testId', test.id);
                testSubjects.push(...subjects);
            }

            const exportData = {
                studyRecords,
                tests,
                testSubjects,
                customSubjects,
                testBatches,
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `study-app-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            showMessage('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showMessage('Failed to export data', 'error');
        }
    });

    importInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.studyRecords || !importData.tests || !importData.testSubjects) {
                showMessage('Invalid file format', 'error');
                return;
            }

            // Import custom subjects
            if (importData.customSubjects) {
                for (const subject of importData.customSubjects) {
                    const { id, ...subjectData } = subject;
                    subjectData.userId = userId;
                    await db.add('customSubjects', subjectData);
                }
            }

            // Import test batches
            if (importData.testBatches) {
                for (const batch of importData.testBatches) {
                    const { id, ...batchData } = batch;
                    batchData.userId = userId;
                    await db.add('testBatches', batchData);
                }
            }

            // Import study records
            for (const record of importData.studyRecords) {
                const { id, ...recordData } = record;
                recordData.userId = userId;
                await db.add('studyRecords', recordData);
            }

            // Import tests
            const testIdMap = new Map();
            for (const test of importData.tests) {
                const { id: oldId, ...testData } = test;
                testData.userId = userId;
                const newId = await db.add('tests', testData);
                testIdMap.set(oldId, newId);
            }

            // Import test subjects
            for (const subject of importData.testSubjects) {
                const { id, testId: oldTestId, ...subjectData } = subject;
                const newTestId = testIdMap.get(oldTestId);
                if (newTestId) {
                    subjectData.testId = newTestId;
                    await db.add('testSubjects', subjectData);
                }
            }

            showMessage('Data imported successfully!', 'success');
            importInput.value = '';
        } catch (error) {
            console.error('Import error:', error);
            showMessage('Failed to import data. Please check the file format.', 'error');
        }
    });

    function showMessage(message, type) {
        messageArea.innerHTML = `<div class="${type === 'success' ? 'success-message' : 'error-message'}">${message}</div>`;
        setTimeout(() => {
            messageArea.innerHTML = '';
        }, 3000);
    }
});
