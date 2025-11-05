export interface User {
  id?: number;
  username: string;
  password: string;
}

export interface StudyRecord {
  id?: number;
  userId: number;
  subject: string;
  date: string;
  topic: string;
  pages: number;
  revisionDate?: string;
}

export interface TestSubject {
  id?: number;
  testId: number;
  subject: string;
  overallMarks: number;
  obtainedMarks: number;
  percentage: number;
}

export interface Test {
  id?: number;
  userId: number;
  testNo: number;
  topic: string;
  overallMarks: number;
  obtainedMarks: number;
  percentage: number;
  subjects?: TestSubject[];
}

export interface SubjectData {
  name: string;
  records: StudyRecord[];
}

