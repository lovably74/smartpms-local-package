import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(url);

// 1. 현재 데이터 조회
const [allItems] = await conn.query('SELECT id, wbsCode, name, level, parentId FROM wbs_items ORDER BY id');

// 2. major 항목 맵 (이름 -> id)
const majorMap = {};
const middleMap = {};
const minorMap = {};
const activityMap = {};

for (const item of allItems) {
  if (item.level === 'major') {
    majorMap[item.name] = item.id;
  }
}

console.log('Major items:', Object.keys(majorMap).length);

// 3. middle 항목의 parentId 수정
// middle의 wbsCode 형식: MM-착공준비-현장개설
// major 이름을 추출하여 매핑
for (const item of allItems) {
  if (item.level === 'middle') {
    // wbsCode: MM-{major이름}-{middle이름}
    const parts = item.wbsCode.split('-');
    // parts[0] = 'MM', parts[1] = major이름
    const majorName = parts[1];
    const majorId = majorMap[majorName];
    if (majorId && majorId !== item.parentId) {
      await conn.query('UPDATE wbs_items SET parentId = ? WHERE id = ?', [majorId, item.id]);
      console.log(`Fixed middle: ${item.name} -> parentId: ${majorId} (was ${item.parentId})`);
    }
    middleMap[item.name] = item.id;
  }
}

// 4. minor 항목의 parentId 수정
// minor의 wbsCode 형식: MN-{major}-{middle}-{minor}
for (const item of allItems) {
  if (item.level === 'minor') {
    const parts = item.wbsCode.split('-');
    // parts[0] = 'MN', parts[1] = major, parts[2] = middle
    const middleName = parts[2];
    const middleId = middleMap[middleName];
    if (middleId && middleId !== item.parentId) {
      await conn.query('UPDATE wbs_items SET parentId = ? WHERE id = ?', [middleId, item.id]);
      console.log(`Fixed minor: ${item.name} -> parentId: ${middleId}`);
    }
    minorMap[item.name] = item.id;
  }
}

// 5. activity 항목의 parentId 수정
// activity wbsCode: A-{major}-{middle}-{minor}-{activity}
for (const item of allItems) {
  if (item.level === 'activity') {
    const parts = item.wbsCode.split('-');
    // A-가설공사-가설울타리-외곽가설-현장 경계구획
    // parts[0]=A, parts[1]=major, parts[2]=middle, parts[3]=minor
    const minorName = parts[3];
    const minorId = minorMap[minorName];
    if (minorId && minorId !== item.parentId) {
      await conn.query('UPDATE wbs_items SET parentId = ? WHERE id = ?', [minorId, item.id]);
      console.log(`Fixed activity: ${item.name} -> parentId: ${minorId}`);
    }
    activityMap[item.name] = item.id;
  }
}

// 6. task 항목의 parentId 수정
// task wbsCode: A-{major}-{middle}-{minor}-{activity}-{task}
for (const item of allItems) {
  if (item.level === 'task') {
    const parts = item.wbsCode.split('-');
    // 마지막 부분 제거하면 activity 코드
    const activityCode = parts.slice(0, -1).join('-');
    // activity 찾기
    const activityItem = allItems.find(a => a.level === 'activity' && a.wbsCode === activityCode);
    if (activityItem && activityItem.id !== item.parentId) {
      await conn.query('UPDATE wbs_items SET parentId = ? WHERE id = ?', [activityItem.id, item.id]);
    }
  }
}

// 7. 결과 확인
const [result] = await conn.query(`
  SELECT level, COUNT(*) as cnt, 
    SUM(CASE WHEN parentId IS NULL THEN 1 ELSE 0 END) as noParent
  FROM wbs_items GROUP BY level
`);
console.log('\nResult:');
result.forEach(r => console.log(r.level, 'count:', r.cnt, 'no parent:', r.noParent));

await conn.end();
console.log('Done!');
