// Reports page logic
let filteredData = {
    studyRecords: [],
    tests: [],
    testBatches: [],
    batchMap: new Map()
};

document.addEventListener('DOMContentLoaded', async () => {
    const userId = requireAuth();
    if (!userId) return;

    await db.init();

    const filterBtn = document.getElementById('filter-reports-btn');
    const resetBtn = document.getElementById('reset-filter-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');

    // Load all data
    async function loadAllData() {
        const studyRecords = await db.getAllByIndex('studyRecords', 'userId', userId);
        const tests = await db.getAllByIndex('tests', 'userId', userId);
        const testBatches = await db.getAllByIndex('testBatches', 'userId', userId);
        const batchMap = new Map(testBatches.map(b => [b.id, b.name]));

        return { studyRecords, tests, testBatches, batchMap };
    }

    // Filter data by date range
    async function filterDataByDate(startDate, endDate) {
        const allData = await loadAllData();
        
        let filteredStudyRecords = allData.studyRecords;
        let filteredTests = allData.tests;

        if (startDate) {
            filteredStudyRecords = filteredStudyRecords.filter(r => r.date >= startDate);
            filteredTests = filteredTests.filter(t => t.testDate && t.testDate >= startDate);
        }

        if (endDate) {
            filteredStudyRecords = filteredStudyRecords.filter(r => r.date <= endDate);
            filteredTests = filteredTests.filter(t => t.testDate && t.testDate <= endDate);
        }

        filteredData = {
            studyRecords: filteredStudyRecords,
            tests: filteredTests,
            testBatches: allData.testBatches,
            batchMap: allData.batchMap
        };

        renderReports();
    }

    // Load initial data
    const initialData = await loadAllData();
    filteredData = initialData;
    filteredData.batchMap = new Map(initialData.testBatches.map(b => [b.id, b.name]));
    renderReports();

    filterBtn.addEventListener('click', async () => {
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        await filterDataByDate(startDate, endDate);
    });

    resetBtn.addEventListener('click', async () => {
        document.getElementById('report-start-date').value = '';
        document.getElementById('report-end-date').value = '';
        const allData = await loadAllData();
        filteredData = allData;
        filteredData.batchMap = new Map(allData.testBatches.map(b => [b.id, b.name]));
        renderReports();
    });

    // Export to PDF
    exportPdfBtn.addEventListener('click', () => {
        exportToPDF();
    });

    // Export to Excel
    exportExcelBtn.addEventListener('click', () => {
        exportToExcel();
    });

    function renderReports() {
        const { studyRecords, tests, testBatches, batchMap } = filteredData;

        // Study Summary
        const totalPages = studyRecords.reduce((sum, r) => sum + (r.pages || 0), 0);
        const totalTopics = new Set(studyRecords.map(r => r.topic)).size;
        const totalDays = new Set(studyRecords.map(r => r.date)).size;
        const revisionCount = studyRecords.filter(r => r.revisionDate).length;

        document.getElementById('study-summary').innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Pages Studied</span>
                <span class="stat-value">${totalPages}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Topics</span>
                <span class="stat-value">${totalTopics}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Study Days</span>
                <span class="stat-value">${totalDays}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Topics Revised</span>
                <span class="stat-value">${revisionCount}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Average Pages/Day</span>
                <span class="stat-value">${totalDays > 0 ? (totalPages / totalDays).toFixed(1) : 0}</span>
            </div>
        `;

        // Test Summary with Batch-wise and Subject-wise Performance
        const totalTests = tests.length;
        const avgPercentage = tests.length > 0 
            ? tests.reduce((sum, t) => sum + t.percentage, 0) / tests.length 
            : 0;
        const testsBelow85 = tests.filter(t => t.percentage < 85).length;
        const bestTest = tests.length > 0 
            ? tests.reduce((best, t) => t.percentage > best.percentage ? t : best, tests[0])
            : null;
        const totalTestMarks = tests.reduce((sum, t) => sum + t.obtainedMarks, 0);
        const totalOverallMarks = tests.reduce((sum, t) => sum + t.overallMarks, 0);

        // Batch-wise Summary
        const batchSummaryMap = new Map();
        tests.forEach(test => {
            const batchName = test.batchId ? batchMap.get(test.batchId) : 'No Batch';
            if (!batchSummaryMap.has(batchName)) {
                batchSummaryMap.set(batchName, {
                    tests: [],
                    totalPercentage: 0,
                    totalObtained: 0,
                    totalOverall: 0
                });
            }
            const batch = batchSummaryMap.get(batchName);
            batch.tests.push(test);
            batch.totalPercentage += test.percentage;
            batch.totalObtained += test.obtainedMarks;
            batch.totalOverall += test.overallMarks;
        });

        const batchSummaryHTML = Array.from(batchSummaryMap.entries())
            .map(([batchName, data]) => {
                const avg = data.tests.length > 0 ? data.totalPercentage / data.tests.length : 0;
                const className = avg < 85 ? 'low' : 'high';
                return `
                    <div class="stat-item">
                        <span class="stat-label">${batchName}</span>
                        <span class="stat-value">
                            <span class="percentage-badge ${className}" style="display: inline-block; padding: 4px 8px;">
                                ${avg.toFixed(2)}% (${data.tests.length} tests)
                            </span>
                        </span>
                    </div>
                `;
            }).join('');

        // Subject-wise performance by batch (async)
        generateSubjectByBatchHTML(tests, batchMap).then(subjectByBatchHTML => {
            document.getElementById('test-summary').innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Total Tests</span>
                    <span class="stat-value">${totalTests}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Average Percentage</span>
                    <span class="stat-value ${avgPercentage < 85 ? 'percentage-badge low' : 'percentage-badge high'}" style="display: inline-block; padding: 4px 8px;">
                        ${avgPercentage.toFixed(2)}%
                    </span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Tests Below 85%</span>
                    <span class="stat-value" style="color: ${testsBelow85 > 0 ? '#ef4444' : '#10b981'}">${testsBelow85}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Marks Obtained</span>
                    <span class="stat-value">${totalTestMarks.toFixed(2)} / ${totalOverallMarks.toFixed(2)}</span>
                </div>
                ${bestTest ? `
                <div class="stat-item">
                    <span class="stat-label">Best Test</span>
                    <span class="stat-value">Test #${bestTest.testNo} - ${bestTest.percentage.toFixed(2)}%</span>
                </div>
                ` : ''}
                ${batchSummaryHTML ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
                    <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">Test Batch-wise Summary:</div>
                    ${batchSummaryHTML}
                </div>
                ` : ''}
                ${subjectByBatchHTML}
            `;
        });

        // Subject-wise Study
        const subjectMap = new Map();
        studyRecords.forEach(record => {
            if (!subjectMap.has(record.subject)) {
                subjectMap.set(record.subject, {
                    pages: 0,
                    topics: new Set(),
                    days: new Set()
                });
            }
            const data = subjectMap.get(record.subject);
            data.pages += record.pages || 0;
            data.topics.add(record.topic);
            data.days.add(record.date);
        });

        const subjectHTML = Array.from(subjectMap.entries())
            .sort((a, b) => b[1].pages - a[1].pages)
            .map(([subject, data]) => `
                <div class="stat-item">
                    <span class="stat-label">${subject}</span>
                    <span class="stat-value">
                        ${data.pages} pages, ${data.topics.size} topics, ${data.days.size} days
                    </span>
                </div>
            `).join('');

        document.getElementById('subject-study').innerHTML = 
            subjectHTML || '<p style="color: #6b7280;">No study records yet.</p>';

        // Performance Analysis
        const batchPerformance = new Map();
        tests.forEach(test => {
            const batchName = test.batchId ? batchMap.get(test.batchId) : 'No Batch';
            if (!batchPerformance.has(batchName)) {
                batchPerformance.set(batchName, {
                    tests: [],
                    totalPercentage: 0
                });
            }
            const batch = batchPerformance.get(batchName);
            batch.tests.push(test);
            batch.totalPercentage += test.percentage;
        });

        const performanceHTML = Array.from(batchPerformance.entries())
            .map(([batchName, data]) => {
                const avg = data.tests.length > 0 ? data.totalPercentage / data.tests.length : 0;
                const className = avg < 85 ? 'low' : 'high';
                return `
                    <div class="stat-item">
                        <span class="stat-label">${batchName}</span>
                        <span class="stat-value">
                            <span class="percentage-badge ${className}" style="display: inline-block; padding: 4px 8px;">
                                ${avg.toFixed(2)}% (${data.tests.length} tests)
                            </span>
                        </span>
                    </div>
                `;
            }).join('');

        document.getElementById('performance-analysis').innerHTML = 
            performanceHTML || '<p style="color: #6b7280;">No test data yet.</p>';
    }

    async function generateSubjectByBatchHTML(tests, batchMap) {
        const subjectByBatchMap = new Map();
        for (const test of tests) {
            const batchName = test.batchId ? batchMap.get(test.batchId) : 'No Batch';
            const testSubjects = await db.getAllByIndex('testSubjects', 'testId', test.id);
            
            testSubjects.forEach(subj => {
                const key = `${batchName}|||${subj.subject}`;
                if (!subjectByBatchMap.has(key)) {
                    subjectByBatchMap.set(key, {
                        batch: batchName,
                        subject: subj.subject,
                        tests: 0,
                        totalPercentage: 0,
                        totalObtained: 0,
                        totalOverall: 0
                    });
                }
                const perf = subjectByBatchMap.get(key);
                perf.tests++;
                perf.totalPercentage += subj.percentage;
                perf.totalObtained += subj.obtainedMarks;
                perf.totalOverall += subj.overallMarks;
            });
        }

        const subjectByBatchGrouped = new Map();
        subjectByBatchMap.forEach((data, key) => {
            if (!subjectByBatchGrouped.has(data.batch)) {
                subjectByBatchGrouped.set(data.batch, []);
            }
            subjectByBatchGrouped.get(data.batch).push(data);
        });

        let subjectByBatchHTML = '';
        subjectByBatchGrouped.forEach((subjects, batchName) => {
            const batchSubjectsHTML = subjects.map(data => {
                const avgPercentage = data.tests > 0 ? data.totalPercentage / data.tests : 0;
                const className = avgPercentage < 85 ? 'low' : 'high';
                return `
                    <div class="stat-item" style="padding-left: 20px;">
                        <span class="stat-label">${data.subject}</span>
                        <span class="stat-value">
                            <span class="percentage-badge ${className}" style="display: inline-block; padding: 4px 8px;">
                                ${avgPercentage.toFixed(2)}% (${data.tests} tests)
                            </span>
                        </span>
                    </div>
                `;
            }).join('');

            subjectByBatchHTML += `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                    <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">${batchName}:</div>
                    ${batchSubjectsHTML}
                </div>
            `;
        });

        return subjectByBatchHTML ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">Subject-wise Performance by Batch:</div>
                ${subjectByBatchHTML}
            </div>
        ` : '';
    }

    async function exportToPDF() {
        const printWindow = window.open('', '_blank');
        const { studyRecords, tests, batchMap } = filteredData;
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        
        // Generate subject-wise by batch data
        const subjectByBatchMap = new Map();
        for (const test of tests) {
            const batchName = test.batchId ? batchMap.get(test.batchId) : 'No Batch';
            const testSubjects = await db.getAllByIndex('testSubjects', 'testId', test.id);
            
            testSubjects.forEach(subj => {
                const key = `${batchName}|||${subj.subject}`;
                if (!subjectByBatchMap.has(key)) {
                    subjectByBatchMap.set(key, {
                        batch: batchName,
                        subject: subj.subject,
                        tests: 0,
                        totalPercentage: 0,
                        totalObtained: 0,
                        totalOverall: 0
                    });
                }
                const perf = subjectByBatchMap.get(key);
                perf.tests++;
                perf.totalPercentage += subj.percentage;
                perf.totalObtained += subj.obtainedMarks;
                perf.totalOverall += subj.overallMarks;
            });
        }

        // Group by batch
        const subjectByBatchGrouped = new Map();
        subjectByBatchMap.forEach((data, key) => {
            if (!subjectByBatchGrouped.has(data.batch)) {
                subjectByBatchGrouped.set(data.batch, []);
            }
            subjectByBatchGrouped.get(data.batch).push(data);
        });

        // Generate subject-wise by batch HTML
        let subjectByBatchHTML = '';
        subjectByBatchGrouped.forEach((subjects, batchName) => {
            const batchTableRows = subjects.map(data => {
                const avgPercentage = data.tests > 0 ? data.totalPercentage / data.tests : 0;
                const className = avgPercentage < 85 ? 'low' : 'high';
                return `
                    <tr class="${className}">
                        <td>${data.subject}</td>
                        <td>${data.tests}</td>
                        <td>${data.totalObtained.toFixed(2)}</td>
                        <td>${data.totalOverall.toFixed(2)}</td>
                        <td>${avgPercentage.toFixed(2)}%</td>
                    </tr>
                `;
            }).join('');

            subjectByBatchHTML += `
                <h3>${batchName} - Subject-wise Performance</h3>
                <table>
                    <tr>
                        <th>Subject</th>
                        <th>Tests</th>
                        <th>Total Obtained</th>
                        <th>Total Overall</th>
                        <th>Average %</th>
                    </tr>
                    ${batchTableRows}
                </table>
            `;
        });
        
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Study Report - ARUNACHALAM STUDY ANALYSE</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #1f2937; }
                    h2 { color: #374151; margin-top: 30px; }
                    h3 { color: #4b5563; margin-top: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; page-break-inside: avoid; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #3b82f6; color: white; }
                    .low { background-color: #fee2e2; color: #991b1b; }
                    .high { background-color: #d1fae5; color: #065f46; }
                    @media print {
                        table { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <h1>ARUNACHALAM STUDY ANALYSE - Report</h1>
                ${startDate || endDate ? `<p><strong>Date Range:</strong> ${startDate || 'All'} to ${endDate || 'All'}</p>` : ''}
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                
                <h2>Study Summary</h2>
                <table>
                    <tr><th>Metric</th><th>Value</th></tr>
                    <tr><td>Total Pages Studied</td><td>${studyRecords.reduce((sum, r) => sum + (r.pages || 0), 0)}</td></tr>
                    <tr><td>Total Topics</td><td>${new Set(studyRecords.map(r => r.topic)).size}</td></tr>
                    <tr><td>Study Days</td><td>${new Set(studyRecords.map(r => r.date)).size}</td></tr>
                </table>

                <h2>Study Records</h2>
                <table>
                    <tr><th>Date</th><th>Subject</th><th>Topic</th><th>Pages</th></tr>
                    ${studyRecords.map(r => `
                        <tr>
                            <td>${new Date(r.date).toLocaleDateString()}</td>
                            <td>${r.subject}</td>
                            <td>${r.topic}</td>
                            <td>${r.pages}</td>
                        </tr>
                    `).join('')}
                </table>

                <h2>Test Summary</h2>
                <table>
                    <tr><th>Test No</th><th>Date</th><th>Topic</th><th>Batch</th><th>Overall</th><th>Obtained</th><th>Percentage</th></tr>
                    ${tests.map(t => {
                        const batchName = t.batchId ? batchMap.get(t.batchId) : 'No Batch';
                        const className = t.percentage < 85 ? 'low' : 'high';
                        return `
                            <tr class="${className}">
                                <td>${t.testNo}</td>
                                <td>${t.testDate ? new Date(t.testDate).toLocaleDateString() : 'N/A'}</td>
                                <td>${t.topic}</td>
                                <td>${batchName}</td>
                                <td>${t.overallMarks}</td>
                                <td>${t.obtainedMarks}</td>
                                <td>${t.percentage.toFixed(2)}%</td>
                            </tr>
                        `;
                    }).join('')}
                </table>

                ${subjectByBatchHTML ? `<h2>Subject-wise Summary by Batch</h2>${subjectByBatchHTML}` : ''}
            </body>
            </html>
        `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
    }

    async function exportToExcel() {
        const { studyRecords, tests, batchMap } = filteredData;
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        
        // Generate subject-wise by batch data
        const subjectByBatchMap = new Map();
        for (const test of tests) {
            const batchName = test.batchId ? batchMap.get(test.batchId) : 'No Batch';
            const testSubjects = await db.getAllByIndex('testSubjects', 'testId', test.id);
            
            testSubjects.forEach(subj => {
                const key = `${batchName}|||${subj.subject}`;
                if (!subjectByBatchMap.has(key)) {
                    subjectByBatchMap.set(key, {
                        batch: batchName,
                        subject: subj.subject,
                        tests: 0,
                        totalPercentage: 0,
                        totalObtained: 0,
                        totalOverall: 0
                    });
                }
                const perf = subjectByBatchMap.get(key);
                perf.tests++;
                perf.totalPercentage += subj.percentage;
                perf.totalObtained += subj.obtainedMarks;
                perf.totalOverall += subj.overallMarks;
            });
        }

        // Group by batch
        const subjectByBatchGrouped = new Map();
        subjectByBatchMap.forEach((data, key) => {
            if (!subjectByBatchGrouped.has(data.batch)) {
                subjectByBatchGrouped.set(data.batch, []);
            }
            subjectByBatchGrouped.get(data.batch).push(data);
        });
        
        let csvContent = '\uFEFF'; // BOM for UTF-8
        
        // Study Records
        csvContent += 'STUDY RECORDS\n';
        csvContent += `Date Range: ${startDate || 'All'} to ${endDate || 'All'}\n`;
        csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
        csvContent += 'Date,Subject,Topic,Pages,Revision Date\n';
        studyRecords.forEach(r => {
            csvContent += `${r.date},"${r.subject}","${r.topic}",${r.pages},${r.revisionDate || ''}\n`;
        });
        
        csvContent += '\n\nTEST RECORDS\n';
        csvContent += 'Test No,Date,Topic,Batch,Overall Marks,Obtained Marks,Percentage\n';
        tests.forEach(t => {
            const batchName = t.batchId ? batchMap.get(t.batchId) : 'No Batch';
            csvContent += `${t.testNo},${t.testDate || ''},"${t.topic}","${batchName}",${t.overallMarks},${t.obtainedMarks},${t.percentage.toFixed(2)}\n`;
        });
        
        // Subject-wise Summary by Batch
        csvContent += '\n\nSUBJECT-WISE SUMMARY BY BATCH\n';
        subjectByBatchGrouped.forEach((subjects, batchName) => {
            csvContent += `\nBatch: ${batchName}\n`;
            csvContent += 'Subject,Tests,Total Obtained,Total Overall,Average Percentage\n';
            subjects.forEach(data => {
                const avgPercentage = data.tests > 0 ? data.totalPercentage / data.tests : 0;
                csvContent += `"${data.subject}",${data.tests},${data.totalObtained.toFixed(2)},${data.totalOverall.toFixed(2)},${avgPercentage.toFixed(2)}%\n`;
            });
        });
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `study-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
