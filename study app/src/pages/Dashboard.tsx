import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/auth';
import { db } from '../services/database';
import { StudyRecord, Test, TestSubject } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userId = getCurrentUser();
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [importError, setImportError] = useState('');

  if (!userId) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExport = async () => {
    try {
      const studyRecords = await db.studyRecords.where('userId').equals(userId).toArray();
      const tests = await db.tests.where('userId').equals(userId).toArray();
      const testIds = tests.map(t => t.id!);
      const testSubjects = await db.testSubjects.where('testId').anyOf(testIds).toArray();

      const exportData = {
        studyRecords,
        tests,
        testSubjects,
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

      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate data structure
      if (!importData.studyRecords || !importData.tests || !importData.testSubjects) {
        setImportError('Invalid file format');
        setTimeout(() => setImportError(''), 3000);
        return;
      }

      // Import study records
      for (const record of importData.studyRecords) {
        const { id, ...recordData } = record;
        recordData.userId = userId;
        await db.studyRecords.add(recordData);
      }

      // Import tests
      const testIdMap = new Map<number, number>();
      for (const test of importData.tests) {
        const { id: oldId, ...testData } = test;
        testData.userId = userId;
        const newId = await db.tests.add(testData);
        if (oldId) {
          testIdMap.set(oldId, newId as number);
        }
      }

      // Import test subjects with updated test IDs
      for (const subject of importData.testSubjects) {
        const { id, testId: oldTestId, ...subjectData } = subject;
        const newTestId = testIdMap.get(oldTestId);
        if (newTestId) {
          subjectData.testId = newTestId;
          await db.testSubjects.add(subjectData);
        }
      }

      setShowImportSuccess(true);
      setTimeout(() => setShowImportSuccess(false), 3000);
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Failed to import data. Please check the file format.');
      setTimeout(() => setImportError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Study App Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Data</span>
          </button>
          <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Import Data</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {showExportSuccess && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Data exported successfully!
          </div>
        )}

        {showImportSuccess && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Data imported successfully!
          </div>
        )}

        {importError && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {importError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Study Folder */}
          <div
            onClick={() => navigate('/study')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow transform hover:scale-105"
          >
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-16 h-16 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Study</h2>
            <p className="text-center text-gray-600">Track your daily study progress</p>
          </div>

          {/* Test Folder */}
          <div
            onClick={() => navigate('/test')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow transform hover:scale-105"
          >
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-16 h-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Test</h2>
            <p className="text-center text-gray-600">Manage your test scores</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

