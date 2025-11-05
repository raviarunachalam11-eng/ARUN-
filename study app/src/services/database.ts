import Dexie, { Table } from 'dexie';
import { User, StudyRecord, Test, TestSubject } from '../types';

export class StudyAppDatabase extends Dexie {
  users!: Table<User, number>;
  studyRecords!: Table<StudyRecord, number>;
  tests!: Table<Test, number>;
  testSubjects!: Table<TestSubject, number>;

  constructor() {
    super('StudyAppDB');
    
    this.version(1).stores({
      users: '++id, username',
      studyRecords: '++id, userId, subject, date',
      tests: '++id, userId, testNo',
      testSubjects: '++id, testId'
    });
  }
}

export const db = new StudyAppDatabase();

