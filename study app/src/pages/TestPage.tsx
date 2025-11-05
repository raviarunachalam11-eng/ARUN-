import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { db } from '../services/database';
import { Test, TestSubject } from '../types';

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = getCurrentUser();
  const [tests, setTests] = useState<Test[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  if (!userId) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    const allTests = await db.tests.where('userId').equals(userId).toArray();
    
    // Load subjects for each test
    const testsWithSubjects = await Promise.all(
      allTests.map(async (test) => {
        const subjects = await db.testSubjects.where('testId').equals(test.id!).toArray();
        return { ...test, subjects };
      })
    );
    
    setTests(testsWithSubjects.sort((a, b) => b.testNo - a.testNo));
  };

  const handleDelete = async () => {
    if (deleteId) {
      // Delete associated subjects first
      const subjects = await db.testSubjects.where('testId').equals(deleteId).toArray();
      await Promise.all(subjects.map(s => db.testSubjects.delete(s.id!)));
      
      // Delete test
      await db.tests.delete(deleteId);
      setShowConfirm(false);
      setDeleteId(null);
      loadTests();
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleEdit = (test: Test) => {
    setEditingId(test.id!);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Test Management</h1>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add New Test
          </button>
        </div>

        {showForm ? (
          <TestForm
            userId={userId}
            testId={editingId}
            onSave={() => {
              setShowForm(false);
              setEditingId(null);
              loadTests();
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Test List</h2>
            {tests.length === 0 ? (
              <p className="text-gray-600">No tests yet. Add your first test!</p>
            ) : (
              <div className="space-y-4">
                {tests.map((test) => {
                  const percentageClass = test.percentage < 85 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
                  return (
                    <div
                      key={test.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Test #{test.testNo} - {test.topic}
                          </h3>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Overall Marks</p>
                              <p className="font-semibold">{test.overallMarks}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Obtained Marks</p>
                              <p className="font-semibold">{test.obtainedMarks}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Percentage</p>
                              <p className={`font-semibold px-2 py-1 rounded ${percentageClass}`}>
                                {test.percentage.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                          
                          {test.subjects && test.subjects.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Subject-wise Breakdown:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {test.subjects.map((subject) => {
                                  const subPercentageClass = subject.percentage < 85 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800';
                                  return (
                                    <div key={subject.id} className="border border-gray-200 rounded p-2">
                                      <p className="font-semibold text-sm">{subject.subject}</p>
                                      <p className="text-xs text-gray-600">
                                        {subject.obtainedMarks}/{subject.overallMarks} - 
                                        <span className={`px-1 rounded ${subPercentageClass}`}>
                                          {subject.percentage.toFixed(2)}%
                                        </span>
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(test)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(test.id!)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this test? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setDeleteId(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface TestFormProps {
  userId: number;
  testId: number | null;
  onSave: () => void;
  onCancel: () => void;
}

const TestForm: React.FC<TestFormProps> = ({ userId, testId, onSave, onCancel }) => {
  const [testNo, setTestNo] = useState('');
  const [topic, setTopic] = useState('');
  const [overallMarks, setOverallMarks] = useState('');
  const [obtainedMarks, setObtainedMarks] = useState('');
  const [subjects, setSubjects] = useState<Omit<TestSubject, 'id' | 'testId' | 'percentage'>[]>([]);
  const [newSubject, setNewSubject] = useState({ subject: '', overallMarks: '', obtainedMarks: '' });

  useEffect(() => {
    if (testId) {
      loadTestData();
    }
  }, [testId]);

  const loadTestData = async () => {
    const test = await db.tests.get(testId!);
    if (test) {
      setTestNo(test.testNo.toString());
      setTopic(test.topic);
      setOverallMarks(test.overallMarks.toString());
      setObtainedMarks(test.obtainedMarks.toString());
      
      const testSubjects = await db.testSubjects.where('testId').equals(testId!).toArray();
      setSubjects(testSubjects.map(s => ({
        subject: s.subject,
        overallMarks: s.overallMarks,
        obtainedMarks: s.obtainedMarks
      })));
    }
  };

  const calculatePercentage = (obtained: number, overall: number): number => {
    if (overall === 0) return 0;
    return (obtained / overall) * 100;
  };

  const percentage = calculatePercentage(parseFloat(obtainedMarks) || 0, parseFloat(overallMarks) || 0);

  const handleAddSubject = () => {
    if (newSubject.subject && newSubject.overallMarks && newSubject.obtainedMarks) {
      setSubjects([...subjects, {
        subject: newSubject.subject,
        overallMarks: parseFloat(newSubject.overallMarks),
        obtainedMarks: parseFloat(newSubject.obtainedMarks)
      }]);
      setNewSubject({ subject: '', overallMarks: '', obtainedMarks: '' });
    }
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const testData = {
      userId,
      testNo: parseInt(testNo),
      topic,
      overallMarks: parseFloat(overallMarks),
      obtainedMarks: parseFloat(obtainedMarks),
      percentage
    };

    if (testId) {
      // Update existing test
      await db.tests.update(testId, testData);
      
      // Delete old subjects
      const oldSubjects = await db.testSubjects.where('testId').equals(testId).toArray();
      await Promise.all(oldSubjects.map(s => db.testSubjects.delete(s.id!)));
      
      // Add updated subjects
      for (const subject of subjects) {
        const subPercentage = calculatePercentage(subject.obtainedMarks, subject.overallMarks);
        await db.testSubjects.add({
          testId,
          subject: subject.subject,
          overallMarks: subject.overallMarks,
          obtainedMarks: subject.obtainedMarks,
          percentage: subPercentage
        });
      }
    } else {
      // Create new test
      const newTestId = await db.tests.add(testData);
      
      // Add subjects
      for (const subject of subjects) {
        const subPercentage = calculatePercentage(subject.obtainedMarks, subject.overallMarks);
        await db.testSubjects.add({
          testId: newTestId as number,
          subject: subject.subject,
          overallMarks: subject.overallMarks,
          obtainedMarks: subject.obtainedMarks,
          percentage: subPercentage
        });
      }
    }

    onSave();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        {testId ? 'Edit Test' : 'Add New Test'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Number</label>
            <input
              type="number"
              value={testNo}
              onChange={(e) => setTestNo(e.target.value)}
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter test topic"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Marks</label>
            <input
              type="number"
              value={overallMarks}
              onChange={(e) => setOverallMarks(e.target.value)}
              required
              min="1"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Obtained Marks</label>
            <input
              type="number"
              value={obtainedMarks}
              onChange={(e) => setObtainedMarks(e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Percentage: {percentage.toFixed(2)}%
          </label>
          <div className={`w-full h-8 rounded-lg flex items-center justify-center font-semibold ${
            percentage < 85 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {percentage.toFixed(2)}%
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Subject-wise Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={newSubject.subject}
                onChange={(e) => setNewSubject({ ...newSubject, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Subject name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overall Marks</label>
              <input
                type="number"
                value={newSubject.overallMarks}
                onChange={(e) => setNewSubject({ ...newSubject, overallMarks: e.target.value })}
                min="1"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Obtained Marks</label>
              <input
                type="number"
                value={newSubject.obtainedMarks}
                onChange={(e) => setNewSubject({ ...newSubject, obtainedMarks: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleAddSubject}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Add Subject
          </button>

          {subjects.length > 0 && (
            <div className="space-y-2 mt-4">
              {subjects.map((subject, index) => {
                const subPercentage = calculatePercentage(subject.obtainedMarks, subject.overallMarks);
                const subPercentageClass = subPercentage < 85 
                  ? 'bg-red-100 text-red-800 border-red-300' 
                  : 'bg-green-100 text-green-800 border-green-300';
                return (
                  <div key={index} className={`border rounded-lg p-3 ${subPercentageClass}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-semibold">{subject.subject}</p>
                        <p className="text-sm">
                          {subject.obtainedMarks}/{subject.overallMarks} - {subPercentage.toFixed(2)}%
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(index)}
                        className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Test
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestPage;

