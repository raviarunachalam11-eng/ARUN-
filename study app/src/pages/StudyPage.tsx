import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { db } from '../services/database';
import { StudyRecord } from '../types';

const SUBJECTS = [
  'Tamil',
  'History',
  'TN History',
  'Economics',
  'Polity',
  'Geography',
  'Science',
  'Current Affairs',
  'English',
  'General Knowledge'
];

const StudyPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = getCurrentUser();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  if (!userId) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Study Management</h1>
        </div>

        {!selectedSubject ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SUBJECTS.map((subject) => (
              <div
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow text-center"
              >
                <h3 className="text-xl font-semibold text-gray-800">{subject}</h3>
              </div>
            ))}
          </div>
        ) : (
          <SubjectDetail
            subject={selectedSubject}
            userId={userId}
            onBack={() => setSelectedSubject(null)}
          />
        )}
      </div>
    </div>
  );
};

interface SubjectDetailProps {
  subject: string;
  userId: number;
  onBack: () => void;
}

const SubjectDetail: React.FC<SubjectDetailProps> = ({ subject, userId, onBack }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');
  const [pages, setPages] = useState('');
  const [revisionDate, setRevisionDate] = useState('');
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const allRecords = await db.studyRecords
      .where('userId').equals(userId)
      .and(r => r.subject === subject)
      .toArray();
    setRecords(allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      await db.studyRecords.update(editingId, {
        date,
        topic,
        pages: parseInt(pages),
        revisionDate: revisionDate || undefined
      });
      setEditingId(null);
    } else {
      await db.studyRecords.add({
        userId,
        subject,
        date,
        topic,
        pages: parseInt(pages),
        revisionDate: revisionDate || undefined
      });
    }

    setTopic('');
    setPages('');
    setRevisionDate('');
    loadRecords();
  };

  const handleEdit = (record: StudyRecord) => {
    setEditingId(record.id!);
    setDate(record.date);
    setTopic(record.topic);
    setPages(record.pages.toString());
    setRevisionDate(record.revisionDate || '');
  };

  const handleDelete = async () => {
    if (deleteId) {
      await db.studyRecords.delete(deleteId);
      setShowConfirm(false);
      setDeleteId(null);
      loadRecords();
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Subjects
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{subject}</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          {editingId ? 'Edit Topic' : 'Add New Topic'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
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
              placeholder="Enter topic name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pages Studied</label>
            <input
              type="number"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Number of pages"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Revision Date (Optional)</label>
            <input
              type="date"
              value={revisionDate}
              onChange={(e) => setRevisionDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setTopic('');
                  setPages('');
                  setRevisionDate('');
                }}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Study Records</h3>
        {records.length === 0 ? (
          <p className="text-gray-600">No study records yet. Add your first topic!</p>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{record.topic}</h4>
                    <p className="text-sm text-gray-600">Date: {new Date(record.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Pages: {record.pages}</p>
                    {record.revisionDate && (
                      <p className="text-sm text-blue-600">
                        Revision: {new Date(record.revisionDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(record)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(record.id!)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this topic? This action cannot be undone.</p>
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
  );
};

export default StudyPage;

