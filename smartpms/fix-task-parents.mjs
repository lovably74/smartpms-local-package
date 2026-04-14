/**
 * task의 parentId를 올바른 activity ID로 수정하는 스크립트
 * task wbsCode: A-01-01-01-001-01 (대-중-소-act번호-task번호)
 */

import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // 모든 계층 데이터를 메모리에 로드
  const [majors] = await conn.execute(
    'SELECT id, wbsCode, name FROM wbs_items WHERE level="major" AND projectId=1 ORDER BY id'
  );
  const [middles] = await conn.execute(
    'SELECT id, wbsCode, name, parentId FROM wbs_items WHERE level="middle" AND projectId=1 ORDER BY id'
  );
  const [minors] = await conn.execute(
    'SELECT id, wbsCode, name, parentId FROM wbs_items WHERE level="minor" AND projectId=1 ORDER BY id'
  );
  const [activities] = await conn.execute(
    'SELECT id, wbsCode, name, parentId FROM wbs_items WHERE level="activity" AND projectId=1 ORDER BY id'
  );
  const [tasks] = await conn.execute(
    'SELECT id, wbsCode, name, parentId FROM wbs_items WHERE level="task" AND projectId=1 ORDER BY id'
  );

  console.log(`majors:${majors.length}, middles:${middles.length}, minors:${minors.length}, activities:${activities.length}, tasks:${tasks.length}`);

  // major를 인덱스로 매핑 (1-based)
  const majorByIdx = {};
  majors.forEach((m, i) => { majorByIdx[i + 1] = m; });

  // middle을 parentId별 인덱스로 매핑
  const middleByParentIdx = {};
  for (const m of middles) {
    if (!middleByParentIdx[m.parentId]) middleByParentIdx[m.parentId] = [];
    middleByParentIdx[m.parentId].push(m);
  }

  // minor를 parentId별 인덱스로 매핑
  const minorByParentIdx = {};
  for (const m of minors) {
    if (!minorByParentIdx[m.parentId]) minorByParentIdx[m.parentId] = [];
    minorByParentIdx[m.parentId].push(m);
  }

  // activity를 parentId별 인덱스로 매핑
  const actByParentIdx = {};
  for (const a of activities) {
    if (!actByParentIdx[a.parentId]) actByParentIdx[a.parentId] = [];
    actByParentIdx[a.parentId].push(a);
  }

  let updatedCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const task of tasks) {
    const parts = task.wbsCode.split('-');
    // A-{majorIdx}-{middleIdx}-{minorIdx}-{actIdx}-{taskIdx}
    if (parts.length < 6) {
      errors.push(`Task ${task.id} bad format: ${task.wbsCode}`);
      errorCount++;
      continue;
    }

    const majorIdx = parseInt(parts[1]);
    const middleIdx = parseInt(parts[2]);
    const minorIdx = parseInt(parts[3]);
    const actIdx = parseInt(parts[4]);

    const major = majorByIdx[majorIdx];
    if (!major) { errors.push(`No major[${majorIdx}] for task ${task.id}`); errorCount++; continue; }

    const middleList = middleByParentIdx[major.id] || [];
    const middle = middleList[middleIdx - 1];
    if (!middle) { errors.push(`No middle[${middleIdx}] under major ${major.id} for task ${task.id}`); errorCount++; continue; }

    const minorList = minorByParentIdx[middle.id] || [];
    const minor = minorList[minorIdx - 1];
    if (!minor) { errors.push(`No minor[${minorIdx}] under middle ${middle.id} for task ${task.id}`); errorCount++; continue; }

    const actList = actByParentIdx[minor.id] || [];
    const activity = actList[actIdx - 1];
    if (!activity) { errors.push(`No activity[${actIdx}] under minor ${minor.id} for task ${task.id}`); errorCount++; continue; }

    if (task.parentId !== activity.id) {
      await conn.execute('UPDATE wbs_items SET parentId=? WHERE id=?', [activity.id, task.id]);
      updatedCount++;
    }
  }

  console.log(`Updated: ${updatedCount}, Errors: ${errorCount}`);
  if (errors.length > 0) console.log('Errors:', errors.slice(0, 5));

  // 검증
  const [verification] = await conn.execute(
    `SELECT t.id, t.name as taskName, t.parentId, a.name as actName, a.level as actLevel
     FROM wbs_items t 
     JOIN wbs_items a ON t.parentId=a.id 
     WHERE t.level="task" 
     LIMIT 5`
  );
  console.log('Verification:', JSON.stringify(verification, null, 2));

} finally {
  await conn.end();
}
