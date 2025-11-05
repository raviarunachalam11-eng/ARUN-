// Test page logic
let editingTestId = null;
let deleteTestId = null;
let deleteBatchId = null;
let testSubjects = [];
let currentBatchId = null;
const DEFAULT_SUBJECTS = [
    'Tamil', 'History', 'TN History', 'Economics', 'Polity',
    'Geography', 'Science', 'Current Affairs', 'English', 'General Knowledge'
];

document.addEventListener('DOMContentLoaded', async () => {
    const userId = requireAuth();
    if (!userId) return;

    await db.init();

    const batchesView = document.getElementById('batches-view');
    const testsView = document.getElementById('tests-view');
    const batchesGrid = document.getElementById('batches-grid');
    const testFormContainer = document.getElementById('test-form-container');
    const testsListContainer = document.getElementById('tests-list-container');
    const addTestBtn = document.getElementById('add-test-btn');
    const backToBatches = document.getElementById('back-to-batches');
    const testForm = document.getElementById('test-form');
    const cancelTestBtn = document.getElementById('cancel-test-btn');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const autoFillBtn = document.getElementById('auto-fill-btn');
    const subjectsList = document.getElementById('subjects-list');
    const confirmDialog = document.getElementById('confirm-dialog');
    const confirmOk = document.getElementById('confirm-ok');
    const confirmCancel = document.getElementById('confirm-cancel');
    const manageBatchesBtn = document.getElementById('manage-batches-btn');
    const manageBatchesModal = document.getElementById('manage-batches-modal');
    const closeBatchesModal = document.getElementById('close-batches-modal');
    const addBatchForm = document.getElementById('add-batch-form');
    const batchesList = document.getElementById('batches-list');
    const subjectNameSelect = document.getElementById('subject-name');
    const batchTitle = document.getElementById('batch-title');

    // Load subjects into dropdown
    async function loadSubjectsDropdown() {
        const customSubjects = await db.getAllByIndex('customSubjects', 'userId', userId);
        const allSubjects = [...DEFAULT_SUBJECTS, ...customSubjects.map(s => s.name)];
        subjectNameSelect.innerHTML = '<option value="">Select Subject</option>' + 
            allSubjects.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // Load and display batches
    async function loadBatchesGrid() {
        const batches = await db.getAllByIndex('testBatches', 'userId', userId);
        
        if (batches.length === 0) {
            batchesGrid.innerHTML = '<p style="color: #6b7280; text-align: center; grid-column: 1 / -1;">No test batches yet. Click "Manage Batches" to add one!</p>';
            return;
        }

        batchesGrid.innerHTML = batches.map(batch => `
            <div class="subject-card" onclick="openBatch(${batch.id}, '${batch.name}')">
                <h3>${batch.name}</h3>
            </div>
        `).join('');
    }

    window.openBatch = (batchId, batchName) => {
        currentBatchId = batchId;
        batchTitle.textContent = `${batchName} - Test Reports`;
        batchesView.style.display = 'none';
        testsView.style.display = 'block';
        loadTests();
        loadSubjectsDropdown();
    };

    backToBatches.addEventListener('click', () => {
        currentBatchId = null;
        batchesView.style.display = 'block';
        testsView.style.display = 'none';
        testFormContainer.style.display = 'none';
        testsListContainer.style.display = 'block';
    });

    // Calculate percentage
    function calculatePercentage(obtained, overall) {
        if (overall === 0) return 0;
        return (obtained / overall) * 100;
    }

    // Update percentage display
    function updatePercentage() {
        const overall = parseFloat(document.getElementById('overall-marks').value) || 0;
        const obtained = parseFloat(document.getElementById('obtained-marks').value) || 0;
        const percentage = calculatePercentage(obtained, overall);
        
        document.getElementById('overall-percentage').textContent = percentage.toFixed(2);
        const bar = document.getElementById('overall-percentage-bar');
        bar.textContent = percentage.toFixed(2) + '%';
        bar.className = 'percentage-bar ' + (percentage < 85 ? 'low' : 'high');
    }

    document.getElementById('overall-marks').addEventListener('input', updatePercentage);
    document.getElementById('obtained-marks').addEventListener('input', updatePercentage);

    // Auto-fill subjects from study records
    autoFillBtn.addEventListener('click', async () => {
        const studyRecords = await db.getAllByIndex('studyRecords', 'userId', userId);
        const subjectMap = new Map();
        
        studyRecords.forEach(record => {
            if (!subjectMap.has(record.subject)) {
                subjectMap.set(record.subject, {
                    subject: record.subject,
                    topics: new Set()
                });
            }
            subjectMap.get(record.subject).topics.add(record.topic);
        });

        // Add unique subjects to testSubjects
        subjectMap.forEach((data, subject) => {
            const exists = testSubjects.some(s => s.subject === subject);
            if (!exists) {
                testSubjects.push({
                    subject: subject,
                    overallMarks: 0,
                    obtainedMarks: 0
                });
            }
        });

        renderSubjects();
        alert(`Auto-filled ${subjectMap.size} subjects from your study records!`);
    });

    // Manage batches
    manageBatchesBtn.addEventListener('click', () => {
        manageBatchesModal.style.display = 'flex';
        loadBatchesList();
    });

    closeBatchesModal.addEventListener('click', () => {
        manageBatchesModal.style.display = 'none';
    });

    manageBatchesModal.addEventListener('click', (e) => {
        if (e.target === manageBatchesModal) {
            manageBatchesModal.style.display = 'none';
        }
    });

    addBatchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const batchName = document.getElementById('new-batch-name').value.trim();
        
        if (!batchName) return;

        await db.add('testBatches', {
            userId,
            name: batchName
        });

        document.getElementById('new-batch-name').value = '';
        loadBatchesList();
        loadBatchesGrid();
    });

    async function loadBatchesList() {
        const batches = await db.getAllByIndex('testBatches', 'userId', userId);
        
        if (batches.length === 0) {
            batchesList.innerHTML = '<p style="color: #6b7280;">No batches yet. Add your first batch!</p>';
            return;
        }

        batchesList.innerHTML = batches.map(batch => `
            <div class="item-row">
                <span>${batch.name}</span>
                <div class="item-row-actions">
                    <button onclick="editBatch(${batch.id}, '${batch.name.replace(/'/g, "\\'")}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 14px;">Edit</button>
                    <button onclick="deleteBatch(${batch.id})" class="btn btn-danger" style="padding: 6px 12px; font-size: 14px;">Delete</button>
                </div>
            </div>
        `).join('');
    }

    window.editBatch = (id, currentName) => {
        const newName = prompt('Enter new batch name:', currentName);
        if (newName && newName.trim()) {
            db.update('testBatches', id, { userId, name: newName.trim() }).then(() => {
                loadBatchesList();
                loadBatchesGrid();
                if (currentBatchId === id) {
                    batchTitle.textContent = `${newName.trim()} - Test Reports`;
                }
            });
        }
    };

    window.deleteBatch = (id) => {
        if (!confirm('Are you sure you want to delete this batch? All tests in this batch will be unlinked.')) return;
        db.delete('testBatches', id).then(() => {
            loadBatchesList();
            loadBatchesGrid();
            if (currentBatchId === id) {
                backToBatches.click();
            }
        });
    };

    addTestBtn.addEventListener('click', async () => {
        if (!currentBatchId) {
            alert('Please select a batch first');
            return;
        }
        editingTestId = null;
        testSubjects = [];
        testForm.reset();
        document.getElementById('test-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('form-title').textContent = 'Add New Test';
        updatePercentage();
        renderSubjects();
        await loadSubjectsDropdown();
        testFormContainer.style.display = 'block';
        testsListContainer.style.display = 'none';
    });

    cancelTestBtn.addEventListener('click', () => {
        testFormContainer.style.display = 'none';
        testsListContainer.style.display = 'block';
        testForm.reset();
        testSubjects = [];
        editingTestId = null;
        renderSubjects();
    });

    addSubjectBtn.addEventListener('click', () => {
        const subjectName = document.getElementById('subject-name').value;
        const subjectOverall = parseFloat(document.getElementById('subject-overall').value);
        const subjectObtained = parseFloat(document.getElementById('subject-obtained').value);

        if (!subjectName || !subjectOverall || subjectObtained === undefined) {
            alert('Please fill in all subject fields');
            return;
        }

        // Check if subject already exists
        const exists = testSubjects.some(s => s.subject === subjectName);
        if (exists) {
            alert('Subject already added!');
            return;
        }

        testSubjects.push({
            subject: subjectName,
            overallMarks: subjectOverall,
            obtainedMarks: subjectObtained
        });

        document.getElementById('subject-name').value = '';
        document.getElementById('subject-overall').value = '';
        document.getElementById('subject-obtained').value = '';
        renderSubjects();
    });

    function renderSubjects() {
        if (testSubjects.length === 0) {
            subjectsList.innerHTML = '';
            return;
        }

        subjectsList.innerHTML = testSubjects.map((subject, index) => {
            const percentage = calculatePercentage(subject.obtainedMarks, subject.overallMarks);
            const className = percentage < 85 ? 'low' : 'high';
            return `
                <div class="subject-item ${className}">
                    <div class="subject-item-info">
                        <div class="subject-item-name">${subject.subject}</div>
                        <div class="subject-item-marks">
                            ${subject.obtainedMarks}/${subject.overallMarks} - ${percentage.toFixed(2)}%
                        </div>
                    </div>
                    <button type="button" class="btn btn-danger subject-item-remove" onclick="removeSubject(${index})">Remove</button>
                </div>
            `;
        }).join('');
    }

    window.removeSubject = (index) => {
        testSubjects.splice(index, 1);
        renderSubjects();
    };

    testForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentBatchId) {
            alert('Please select a batch first');
            return;
        }

        const testDate = document.getElementById('test-date').value;
        const testNo = parseInt(document.getElementById('test-no').value);
        const topic = document.getElementById('test-topic').value;
        const overallMarks = parseFloat(document.getElementById('overall-marks').value);
        const obtainedMarks = parseFloat(document.getElementById('obtained-marks').value);
        const percentage = calculatePercentage(obtainedMarks, overallMarks);

        const testData = {
            userId,
            batchId: currentBatchId,
            testDate,
            testNo,
            topic,
            overallMarks,
            obtainedMarks,
            percentage
        };

        try {
            let newTestId;
            if (editingTestId) {
                await db.update('tests', editingTestId, testData);
                newTestId = editingTestId;
                
                // Delete old subjects
                const oldSubjects = await db.getAllByIndex('testSubjects', 'testId', editingTestId);
                for (const subject of oldSubjects) {
                    await db.delete('testSubjects', subject.id);
                }
            } else {
                newTestId = await db.add('tests', testData);
            }

            // Add subjects
            for (const subject of testSubjects) {
                const subPercentage = calculatePercentage(subject.obtainedMarks, subject.overallMarks);
                await db.add('testSubjects', {
                    testId: newTestId,
                    subject: subject.subject,
                    overallMarks: subject.overallMarks,
                    obtainedMarks: subject.obtainedMarks,
                    percentage: subPercentage
                });
            }

            testFormContainer.style.display = 'none';
            testsListContainer.style.display = 'block';
            testForm.reset();
            testSubjects = [];
            editingTestId = null;
            renderSubjects();
            loadTests();
        } catch (error) {
            console.error('Error saving test:', error);
            alert('Failed to save test');
        }
    });

    window.editTest = async (id) => {
        editingTestId = id;
        const test = await db.get('tests', id);
        const subjects = await db.getAllByIndex('testSubjects', 'testId', id);

        document.getElementById('test-date').value = test.testDate || new Date().toISOString().split('T')[0];
        document.getElementById('test-no').value = test.testNo;
        document.getElementById('test-topic').value = test.topic;
        document.getElementById('overall-marks').value = test.overallMarks;
        document.getElementById('obtained-marks').value = test.obtainedMarks;
        
        testSubjects = subjects.map(s => ({
            subject: s.subject,
            overallMarks: s.overallMarks,
            obtainedMarks: s.obtainedMarks
        }));

        document.getElementById('form-title').textContent = 'Edit Test';
        updatePercentage();
        renderSubjects();
        await loadSubjectsDropdown();
        testFormContainer.style.display = 'block';
        testsListContainer.style.display = 'none';
    };

    window.deleteTest = (id) => {
        deleteTestId = id;
        confirmDialog.style.display = 'flex';
    };

    confirmOk.addEventListener('click', async () => {
        if (deleteTestId) {
            try {
                // Delete associated subjects
                const subjects = await db.getAllByIndex('testSubjects', 'testId', deleteTestId);
                for (const subject of subjects) {
                    await db.delete('testSubjects', subject.id);
                }
                
                // Delete test
                await db.delete('tests', deleteTestId);
                deleteTestId = null;
                confirmDialog.style.display = 'none';
                loadTests();
            } catch (error) {
                console.error('Error deleting test:', error);
                alert('Failed to delete test');
            }
        }
    });

    confirmCancel.addEventListener('click', () => {
        deleteTestId = null;
        confirmDialog.style.display = 'none';
    });

    async function loadTests() {
        if (!currentBatchId) return;

        const allTests = await db.getAllByIndex('tests', 'userId', userId);
        const tests = allTests
            .filter(t => t.batchId === currentBatchId)
            .sort((a, b) => b.testNo - a.testNo);

        if (tests.length === 0) {
            document.getElementById('tests-list').innerHTML = '<p style="color: #6b7280;">No tests yet. Add your first test report!</p>';
            return;
        }

        const testsHTML = await Promise.all(tests.map(async (test) => {
            const subjects = await db.getAllByIndex('testSubjects', 'testId', test.id);
            const percentageClass = test.percentage < 85 ? 'low' : 'high';
            
            const subjectsHTML = subjects.length > 0 ? `
                <div class="subject-breakdown">
                    <h3>Subject-wise Breakdown:</h3>
                    <div class="subjects-added">
                        ${subjects.map(subject => {
                            const subPercentageClass = subject.percentage < 85 ? 'low' : 'high';
                            return `
                                <div class="subject-item ${subPercentageClass}">
                                    <div class="subject-item-info">
                                        <div class="subject-item-name">${subject.subject}</div>
                                        <div class="subject-item-marks">
                                            ${subject.obtainedMarks}/${subject.overallMarks} - ${subject.percentage.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : '';

            return `
                <div class="test-item">
                    <div class="test-header">
                        <div>
                            <div class="test-title">Test #${test.testNo} - ${test.topic}</div>
                            ${test.testDate ? `<div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Date: ${new Date(test.testDate).toLocaleDateString()}</div>` : ''}
                        </div>
                        <div>
                            <button class="btn btn-primary" onclick="editTest(${test.id})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteTest(${test.id})">Delete</button>
                        </div>
                    </div>
                    <div class="test-stats">
                        <div class="test-stat">
                            <div class="test-stat-label">Overall Marks</div>
                            <div class="test-stat-value">${test.overallMarks}</div>
                        </div>
                        <div class="test-stat">
                            <div class="test-stat-label">Obtained Marks</div>
                            <div class="test-stat-value">${test.obtainedMarks}</div>
                        </div>
                        <div class="test-stat">
                            <div class="test-stat-label">Percentage</div>
                            <div class="test-stat-value">
                                <span class="percentage-badge ${percentageClass}">${test.percentage.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                    ${subjectsHTML}
                </div>
            `;
        }));

        document.getElementById('tests-list').innerHTML = testsHTML.join('');
    }

    // Initialize
    loadBatchesGrid();
});
