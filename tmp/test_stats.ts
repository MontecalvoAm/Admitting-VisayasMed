import pool from '../src/lib/db';
import { RowDataPacket } from 'mysql2';

async function getStats() {
  const [patientCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM M_Patients WHERE IsDeleted = 0');
  const [todayCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM M_Patients WHERE DATE(CreatedAt) = CURDATE() AND IsDeleted = 0');
  const [yesterdayCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM M_Patients WHERE DATE(CreatedAt) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND IsDeleted = 0');
  
  const [doctorCount] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM M_Users u 
     JOIN M_Roles r ON u.RoleID = r.RoleID 
     WHERE (r.RoleName LIKE '%Doctor%' OR r.RoleName LIKE '%Physician%') AND u.IsDeleted = 0`
  );
  
  // Calculate Growth Rate (Daily)
  const todayVal = todayCount[0].count;
  const yesterdayVal = yesterdayCount[0].count;
  let growthRate = 0;
  if (yesterdayVal > 0) {
    growthRate = ((todayVal - yesterdayVal) / yesterdayVal) * 100;
  } else if (todayVal > 0) {
    growthRate = 100;
  }

  return {
    totalPatients: patientCount[0].count,
    todayAdmissions: todayVal,
    activeDoctors: doctorCount[0].count,
    growthRate: growthRate.toFixed(1),
    isPositiveGrowth: growthRate >= 0
  };
}

getStats().then(stats => {
  console.log('Stats Result:', JSON.stringify(stats, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
