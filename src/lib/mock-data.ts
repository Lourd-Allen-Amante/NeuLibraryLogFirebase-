
import { UserProfile, VisitRecord, Purpose } from './types';
import { subDays, startOfDay, formatISO } from 'date-fns';

export const MOCK_USERS: UserProfile[] = [
  {
    id: '1',
    schoolId: '2023-0001',
    email: 'john.doe@neu.edu.ph',
    name: 'John Doe',
    college: 'College of Engineering',
    role: 'visitor',
    isBlocked: false
  },
  {
    id: '2',
    schoolId: '2023-0002',
    email: 'jane.smith@neu.edu.ph',
    name: 'Jane Smith',
    college: 'College of Arts and Sciences',
    role: 'visitor',
    isBlocked: false
  },
  {
    id: '3',
    schoolId: '2023-0003',
    email: 'admin@neu.edu.ph',
    name: 'Library Administrator',
    college: 'Administration',
    role: 'admin',
    isBlocked: false
  }
];

const purposes: Purpose[] = ['Reading Books', 'Research in Thesis', 'Use of Computer', 'Doing Assignments'];

export const generateMockVisits = (days: number = 30): VisitRecord[] => {
  const visits: VisitRecord[] = [];
  const baseDate = startOfDay(new Date());

  for (let i = 0; i < days; i++) {
    const dailyCount = Math.floor(Math.random() * 15) + 5;
    for (let j = 0; j < dailyCount; j++) {
      const user = MOCK_USERS[Math.floor(Math.random() * 2)];
      const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
      const minute = Math.floor(Math.random() * 60);
      const date = new Date(subDays(baseDate, i));
      date.setHours(hour, minute);

      visits.push({
        id: `v-${i}-${j}`,
        userId: user.id,
        userName: user.name,
        college: user.college,
        purpose: purposes[Math.floor(Math.random() * purposes.length)],
        timestamp: formatISO(date)
      });
    }
  }
  return visits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const INITIAL_VISITS = generateMockVisits(30);
