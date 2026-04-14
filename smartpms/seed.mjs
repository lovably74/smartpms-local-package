import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// WBS 데이터 (엑셀에서 추출)
const wbsRawData = [
  // 착공준비
  { wbs_code: 'A-01-01-01-001-01', category: '공통', major: '착공준비', middle: '현장개설', minor: '현장조사', activity: '착공 전 현황조사', task: '경계측량 실시', predecessor: '-', successor: 'A-01-01-01-001-02', plan_start: '2026-01-02', plan_end: '2026-01-03' },
  { wbs_code: 'A-01-01-01-001-02', category: '공통', major: '착공준비', middle: '현장개설', minor: '현장조사', activity: '착공 전 현황조사', task: '인접건물 현황조사', predecessor: 'A-01-01-01-001-01', successor: 'A-01-01-01-001-03', plan_start: '2026-01-04', plan_end: '2026-01-05' },
  { wbs_code: 'A-01-01-01-001-03', category: '공통', major: '착공준비', middle: '현장개설', minor: '현장조사', activity: '착공 전 현황조사', task: '도로 및 지장물 조사', predecessor: 'A-01-01-01-001-02', successor: 'A-01-01-02-001-01', plan_start: '2026-01-06', plan_end: '2026-01-07' },
  { wbs_code: 'A-01-01-02-001-01', category: '공통', major: '착공준비', middle: '현장개설', minor: '인허가연계', activity: '착공신고', task: '착공신고 서류 제출', predecessor: 'A-01-01-01-001-03', successor: 'A-01-01-02-001-02', plan_start: '2026-01-08', plan_end: '2026-01-09' },
  { wbs_code: 'A-01-01-02-001-02', category: '공통', major: '착공준비', middle: '현장개설', minor: '인허가연계', activity: '착공신고', task: '관계기관 협의 완료', predecessor: 'A-01-01-02-001-01', successor: 'A-02-01-01-001-01', plan_start: '2026-01-10', plan_end: '2026-01-11' },
  // 가설공사
  { wbs_code: 'A-02-01-01-001-01', category: '공통', major: '가설공사', middle: '가설울타리', minor: '외곽가설', activity: '현장 경계구획', task: '가설휀스 설치', predecessor: 'A-01-01-02-001-02', successor: 'A-02-01-01-001-02', plan_start: '2026-01-12', plan_end: '2026-01-14' },
  { wbs_code: 'A-02-01-01-001-02', category: '공통', major: '가설공사', middle: '가설울타리', minor: '외곽가설', activity: '현장 경계구획', task: '현장 안내표지 설치', predecessor: 'A-02-01-01-001-01', successor: 'A-02-01-02-001-01', plan_start: '2026-01-15', plan_end: '2026-01-16' },
  { wbs_code: 'A-02-01-02-001-01', category: '공통', major: '가설공사', middle: '가설울타리', minor: '출입통제', activity: '출입구 조성', task: '공사차량 출입문 설치', predecessor: 'A-02-01-01-001-02', successor: 'A-02-01-02-001-02', plan_start: '2026-01-17', plan_end: '2026-01-18' },
  { wbs_code: 'A-02-01-02-001-02', category: '공통', major: '가설공사', middle: '가설울타리', minor: '출입통제', activity: '출입구 조성', task: '경비실 설치', predecessor: 'A-02-01-02-001-01', successor: 'A-02-01-02-001-03', plan_start: '2026-01-19', plan_end: '2026-01-20' },
  { wbs_code: 'A-02-01-02-001-03', category: '공통', major: '가설공사', middle: '가설울타리', minor: '출입통제', activity: '출입구 조성', task: '출입 통제 시스템 설치', predecessor: 'A-02-01-02-001-02', successor: 'A-02-02-01-001-01', plan_start: '2026-01-21', plan_end: '2026-01-22' },
  { wbs_code: 'A-02-02-01-001-01', category: '공통', major: '가설공사', middle: '가설전기', minor: '임시수전', activity: '가설전기 구축', task: '한전 인입 협의', predecessor: 'A-02-01-02-001-03', successor: 'A-02-02-01-001-02', plan_start: '2026-01-23', plan_end: '2026-01-25' },
  { wbs_code: 'A-02-02-01-001-02', category: '공통', major: '가설공사', middle: '가설전기', minor: '임시수전', activity: '가설전기 구축', task: '분전반 설치', predecessor: 'A-02-02-01-001-01', successor: 'A-02-02-01-001-03', plan_start: '2026-01-26', plan_end: '2026-01-28' },
  { wbs_code: 'A-02-02-01-001-03', category: '공통', major: '가설공사', middle: '가설전기', minor: '임시수전', activity: '가설전기 구축', task: '임시 배선 설치', predecessor: 'A-02-02-01-001-02', successor: 'A-02-03-01-001-01', plan_start: '2026-01-29', plan_end: '2026-01-31' },
  { wbs_code: 'A-02-03-01-001-01', category: '공통', major: '가설공사', middle: '가설급배수', minor: '임시급수', activity: '현장 용수공급', task: '상수도 인입', predecessor: 'A-02-02-01-001-03', successor: 'A-02-03-01-001-02', plan_start: '2026-02-01', plan_end: '2026-02-03' },
  { wbs_code: 'A-02-03-01-001-02', category: '공통', major: '가설공사', middle: '가설급배수', minor: '임시급수', activity: '현장 용수공급', task: '임시배관 설치', predecessor: 'A-02-03-01-001-01', successor: 'A-02-03-02-001-01', plan_start: '2026-02-04', plan_end: '2026-02-06' },
  { wbs_code: 'A-02-03-02-001-01', category: '공통', major: '가설공사', middle: '가설급배수', minor: '임시배수', activity: '현장 배수체계', task: '배수로 설치', predecessor: 'A-02-03-01-001-02', successor: 'A-02-03-02-001-02', plan_start: '2026-02-07', plan_end: '2026-02-09' },
  { wbs_code: 'A-02-03-02-001-02', category: '공통', major: '가설공사', middle: '가설급배수', minor: '임시배수', activity: '현장 배수체계', task: '집수정 설치', predecessor: 'A-02-03-02-001-01', successor: 'A-02-04-01-001-01', plan_start: '2026-02-10', plan_end: '2026-02-12' },
  { wbs_code: 'A-02-04-01-001-01', category: '공통', major: '가설공사', middle: '현장사무소', minor: '사무동', activity: '현장 운영시설', task: '사무실 설치', predecessor: 'A-02-03-02-001-02', successor: 'A-02-04-01-001-02', plan_start: '2026-02-13', plan_end: '2026-02-15' },
  { wbs_code: 'A-02-04-01-001-02', category: '공통', major: '가설공사', middle: '현장사무소', minor: '사무동', activity: '현장 운영시설', task: '회의실 설치', predecessor: 'A-02-04-01-001-01', successor: 'A-02-04-01-001-03', plan_start: '2026-02-16', plan_end: '2026-02-18' },
  { wbs_code: 'A-02-04-01-001-03', category: '공통', major: '가설공사', middle: '현장사무소', minor: '사무동', activity: '현장 운영시설', task: '자재창고 설치', predecessor: 'A-02-04-01-001-02', successor: 'A-02-04-02-001-01', plan_start: '2026-02-19', plan_end: '2026-02-21' },
  { wbs_code: 'A-02-04-02-001-01', category: '공통', major: '가설공사', middle: '현장사무소', minor: '근로자시설', activity: '복지시설 구축', task: '휴게실 설치', predecessor: 'A-02-04-01-001-03', successor: 'A-02-04-02-001-02', plan_start: '2026-02-22', plan_end: '2026-02-24' },
  { wbs_code: 'A-02-04-02-001-02', category: '공통', major: '가설공사', middle: '현장사무소', minor: '근로자시설', activity: '복지시설 구축', task: '화장실 설치', predecessor: 'A-02-04-02-001-01', successor: 'A-02-04-02-001-03', plan_start: '2026-02-25', plan_end: '2026-02-27' },
  { wbs_code: 'A-02-04-02-001-03', category: '공통', major: '가설공사', middle: '현장사무소', minor: '근로자시설', activity: '복지시설 구축', task: '탈의실 설치', predecessor: 'A-02-04-02-001-02', successor: 'A-02-05-01-001-01', plan_start: '2026-02-28', plan_end: '2026-03-02' },
  // 부지조성
  { wbs_code: 'A-03-01-01-001-01', category: '공통', major: '부지조성', middle: '벌개제근', minor: '지장물제거', activity: '부지정리', task: '수목 제거', predecessor: 'A-02-04-02-001-03', successor: 'A-03-01-01-001-02', plan_start: '2026-03-01', plan_end: '2026-03-05' },
  { wbs_code: 'A-03-01-01-001-02', category: '공통', major: '부지조성', middle: '벌개제근', minor: '지장물제거', activity: '부지정리', task: '폐기물 반출', predecessor: 'A-03-01-01-001-01', successor: 'A-03-01-01-001-03', plan_start: '2026-03-06', plan_end: '2026-03-10' },
  { wbs_code: 'A-03-01-01-001-03', category: '공통', major: '부지조성', middle: '벌개제근', minor: '지장물제거', activity: '부지정리', task: '지하 매설물 이설', predecessor: 'A-03-01-01-001-02', successor: 'A-03-02-01-001-01', plan_start: '2026-03-11', plan_end: '2026-03-15' },
  { wbs_code: 'A-03-02-01-001-01', category: '공통', major: '부지조성', middle: '절성토', minor: '토공', activity: '대지정지', task: '절토 시행', predecessor: 'A-03-01-01-001-03', successor: 'A-03-02-01-001-02', plan_start: '2026-03-16', plan_end: '2026-03-25' },
  { wbs_code: 'A-03-02-01-001-02', category: '공통', major: '부지조성', middle: '절성토', minor: '토공', activity: '대지정지', task: '성토 시행', predecessor: 'A-03-02-01-001-01', successor: 'A-03-02-01-001-03', plan_start: '2026-03-26', plan_end: '2026-04-05' },
  { wbs_code: 'A-03-02-01-001-03', category: '공통', major: '부지조성', middle: '절성토', minor: '토공', activity: '대지정지', task: '다짐 완료', predecessor: 'A-03-02-01-001-02', successor: 'A-03-03-01-001-01', plan_start: '2026-04-06', plan_end: '2026-04-10' },
  { wbs_code: 'A-03-03-01-001-01', category: '공통', major: '부지조성', middle: '흙막이', minor: 'CIP/SCW', activity: '굴착 준비', task: '천공 위치 먹매김', predecessor: 'A-03-02-01-001-03', successor: 'A-03-03-01-001-02', plan_start: '2026-04-11', plan_end: '2026-04-15' },
  { wbs_code: 'A-03-03-01-001-02', category: '공통', major: '부지조성', middle: '흙막이', minor: 'CIP/SCW', activity: '굴착 준비', task: '천공 작업', predecessor: 'A-03-03-01-001-01', successor: 'A-03-03-01-001-03', plan_start: '2026-04-16', plan_end: '2026-04-30' },
  { wbs_code: 'A-03-03-01-001-03', category: '공통', major: '부지조성', middle: '흙막이', minor: 'CIP/SCW', activity: '굴착 준비', task: 'CIP 타설', predecessor: 'A-03-03-01-001-02', successor: 'A-03-03-01-001-04', plan_start: '2026-05-01', plan_end: '2026-05-15' },
  { wbs_code: 'A-03-03-01-001-04', category: '공통', major: '부지조성', middle: '흙막이', minor: 'CIP/SCW', activity: '굴착 준비', task: '두부정리', predecessor: 'A-03-03-01-001-03', successor: 'A-03-03-02-001-01', plan_start: '2026-05-16', plan_end: '2026-05-20' },
  // 기초공사
  { wbs_code: 'A-04-01-01-001-01', category: '공통', major: '기초공사', middle: '말뚝공사', minor: 'PHC파일', activity: '파일 시공', task: '파일 반입 및 검수', predecessor: 'A-03-03-01-001-04', successor: 'A-04-01-01-001-02', plan_start: '2026-05-21', plan_end: '2026-05-25' },
  { wbs_code: 'A-04-01-01-001-02', category: '공통', major: '기초공사', middle: '말뚝공사', minor: 'PHC파일', activity: '파일 시공', task: '파일 항타', predecessor: 'A-04-01-01-001-01', successor: 'A-04-01-01-001-03', plan_start: '2026-05-26', plan_end: '2026-06-15' },
  { wbs_code: 'A-04-01-01-001-03', category: '공통', major: '기초공사', middle: '말뚝공사', minor: 'PHC파일', activity: '파일 시공', task: '두부정리', predecessor: 'A-04-01-01-001-02', successor: 'A-04-02-01-001-01', plan_start: '2026-06-16', plan_end: '2026-06-20' },
  { wbs_code: 'A-04-02-01-001-01', category: '공통', major: '기초공사', middle: '기초슬라브', minor: '매트기초', activity: '기초타설', task: '버림콘크리트 타설', predecessor: 'A-04-01-01-001-03', successor: 'A-04-02-01-001-02', plan_start: '2026-06-21', plan_end: '2026-06-25' },
  { wbs_code: 'A-04-02-01-001-02', category: '공통', major: '기초공사', middle: '기초슬라브', minor: '매트기초', activity: '기초타설', task: '기초 철근 배근', predecessor: 'A-04-02-01-001-01', successor: 'A-04-02-01-001-03', plan_start: '2026-06-26', plan_end: '2026-07-10' },
  { wbs_code: 'A-04-02-01-001-03', category: '공통', major: '기초공사', middle: '기초슬라브', minor: '매트기초', activity: '기초타설', task: '매트 기초 콘크리트 타설', predecessor: 'A-04-02-01-001-02', successor: 'A-05-01-01-001-01', plan_start: '2026-07-11', plan_end: '2026-07-20' },
  // 골조공사
  { wbs_code: 'A-05-01-01-001-01', category: '공통', major: '골조공사', middle: '지하층골조', minor: '지하구조체', activity: '지하층 시공', task: '지하 3층 거푸집 설치', predecessor: 'A-04-02-01-001-03', successor: 'A-05-01-01-001-02', plan_start: '2026-07-21', plan_end: '2026-08-05' },
  { wbs_code: 'A-05-01-01-001-02', category: '공통', major: '골조공사', middle: '지하층골조', minor: '지하구조체', activity: '지하층 시공', task: '지하 3층 철근 배근', predecessor: 'A-05-01-01-001-01', successor: 'A-05-01-01-001-03', plan_start: '2026-08-06', plan_end: '2026-08-20' },
  { wbs_code: 'A-05-01-01-001-03', category: '공통', major: '골조공사', middle: '지하층골조', minor: '지하구조체', activity: '지하층 시공', task: '지하 3층 콘크리트 타설', predecessor: 'A-05-01-01-001-02', successor: 'A-05-01-01-001-04', plan_start: '2026-08-21', plan_end: '2026-08-31' },
  { wbs_code: 'A-05-01-01-001-04', category: '공통', major: '골조공사', middle: '지하층골조', minor: '지하구조체', activity: '지하층 시공', task: '지하 2층 시공', predecessor: 'A-05-01-01-001-03', successor: 'A-05-01-01-001-05', plan_start: '2026-09-01', plan_end: '2026-09-30' },
  { wbs_code: 'A-05-01-01-001-05', category: '공통', major: '골조공사', middle: '지하층골조', minor: '지하구조체', activity: '지하층 시공', task: '지하 1층 시공', predecessor: 'A-05-01-01-001-04', successor: 'A-05-02-01-001-01', plan_start: '2026-10-01', plan_end: '2026-10-31' },
  { wbs_code: 'A-05-02-01-001-01', category: '공통', major: '골조공사', middle: '지상층골조', minor: '지상구조체', activity: '지상층 시공', task: '1층 골조 시공', predecessor: 'A-05-01-01-001-05', successor: 'A-05-02-01-001-02', plan_start: '2026-11-01', plan_end: '2026-11-30' },
  { wbs_code: 'A-05-02-01-001-02', category: '공통', major: '골조공사', middle: '지상층골조', minor: '지상구조체', activity: '지상층 시공', task: '2~5층 골조 시공', predecessor: 'A-05-02-01-001-01', successor: 'A-05-02-01-001-03', plan_start: '2026-12-01', plan_end: '2027-02-28' },
  { wbs_code: 'A-05-02-01-001-03', category: '공통', major: '골조공사', middle: '지상층골조', minor: '지상구조체', activity: '지상층 시공', task: '6~10층 골조 시공', predecessor: 'A-05-02-01-001-02', successor: 'A-05-02-01-001-04', plan_start: '2027-03-01', plan_end: '2027-05-31' },
  { wbs_code: 'A-05-02-01-001-04', category: '공통', major: '골조공사', middle: '지상층골조', minor: '지상구조체', activity: '지상층 시공', task: '11~15층 골조 시공', predecessor: 'A-05-02-01-001-03', successor: 'A-05-02-01-001-05', plan_start: '2027-06-01', plan_end: '2027-08-31' },
  { wbs_code: 'A-05-02-01-001-05', category: '공통', major: '골조공사', middle: '지상층골조', minor: '지상구조체', activity: '지상층 시공', task: '16~20층 골조 시공 (최상층)', predecessor: 'A-05-02-01-001-04', successor: 'A-06-01-01-001-01', plan_start: '2027-09-01', plan_end: '2027-11-30' },
  // 방수공사
  { wbs_code: 'A-06-01-01-001-01', category: '공통', major: '방수공사', middle: '지하방수', minor: '외벽방수', activity: '지하 방수 시공', task: '방수 바탕면 처리', predecessor: 'A-05-02-01-001-05', successor: 'A-06-01-01-001-02', plan_start: '2027-09-01', plan_end: '2027-09-10' },
  { wbs_code: 'A-06-01-01-001-02', category: '공통', major: '방수공사', middle: '지하방수', minor: '외벽방수', activity: '지하 방수 시공', task: '도막방수 시공', predecessor: 'A-06-01-01-001-01', successor: 'A-06-01-01-001-03', plan_start: '2027-09-11', plan_end: '2027-09-25' },
  { wbs_code: 'A-06-01-01-001-03', category: '공통', major: '방수공사', middle: '지하방수', minor: '외벽방수', activity: '지하 방수 시공', task: '보호층 설치', predecessor: 'A-06-01-01-001-02', successor: 'A-06-02-01-001-01', plan_start: '2027-09-26', plan_end: '2027-10-05' },
  { wbs_code: 'A-06-02-01-001-01', category: '공통', major: '방수공사', middle: '옥상방수', minor: '지붕방수', activity: '옥상 방수 시공', task: '옥상 바탕면 정리', predecessor: 'A-06-01-01-001-03', successor: 'A-06-02-01-001-02', plan_start: '2027-10-06', plan_end: '2027-10-15' },
  { wbs_code: 'A-06-02-01-001-02', category: '공통', major: '방수공사', middle: '옥상방수', minor: '지붕방수', activity: '옥상 방수 시공', task: '시트방수 시공', predecessor: 'A-06-02-01-001-01', successor: 'A-06-02-01-001-03', plan_start: '2027-10-16', plan_end: '2027-10-31' },
  { wbs_code: 'A-06-02-01-001-03', category: '공통', major: '방수공사', middle: '옥상방수', minor: '지붕방수', activity: '옥상 방수 시공', task: '방수 마감 및 검사', predecessor: 'A-06-02-01-001-02', successor: 'A-07-01-01-001-01', plan_start: '2027-11-01', plan_end: '2027-11-10' },
  // 조적공사
  { wbs_code: 'A-07-01-01-001-01', category: '공통', major: '조적공사', middle: '내벽조적', minor: '블록조적', activity: '내벽 시공', task: '블록 반입 및 검수', predecessor: 'A-06-02-01-001-03', successor: 'A-07-01-01-001-02', plan_start: '2027-10-01', plan_end: '2027-10-10' },
  { wbs_code: 'A-07-01-01-001-02', category: '공통', major: '조적공사', middle: '내벽조적', minor: '블록조적', activity: '내벽 시공', task: '블록 쌓기 시공', predecessor: 'A-07-01-01-001-01', successor: 'A-07-01-01-001-03', plan_start: '2027-10-11', plan_end: '2027-12-31' },
  { wbs_code: 'A-07-01-01-001-03', category: '공통', major: '조적공사', middle: '내벽조적', minor: '블록조적', activity: '내벽 시공', task: '줄눈 마감', predecessor: 'A-07-01-01-001-02', successor: 'A-08-01-01-001-01', plan_start: '2028-01-01', plan_end: '2028-01-15' },
  // 미장공사
  { wbs_code: 'A-08-01-01-001-01', category: '공통', major: '미장공사', middle: '내부미장', minor: '벽체미장', activity: '내부 미장 시공', task: '바탕면 처리', predecessor: 'A-07-01-01-001-03', successor: 'A-08-01-01-001-02', plan_start: '2027-12-01', plan_end: '2027-12-15' },
  { wbs_code: 'A-08-01-01-001-02', category: '공통', major: '미장공사', middle: '내부미장', minor: '벽체미장', activity: '내부 미장 시공', task: '시멘트 모르타르 미장', predecessor: 'A-08-01-01-001-01', successor: 'A-08-01-01-001-03', plan_start: '2027-12-16', plan_end: '2028-02-28' },
  { wbs_code: 'A-08-01-01-001-03', category: '공통', major: '미장공사', middle: '내부미장', minor: '벽체미장', activity: '내부 미장 시공', task: '미장 양생 및 검사', predecessor: 'A-08-01-01-001-02', successor: 'A-09-01-01-001-01', plan_start: '2028-03-01', plan_end: '2028-03-10' },
  // 내장공사
  { wbs_code: 'A-09-01-01-001-01', category: '공통', major: '내장공사', middle: '천장공사', minor: '경량철골천장', activity: '천장 시공', task: '경량철골 설치', predecessor: 'A-08-01-01-001-03', successor: 'A-09-01-01-001-02', plan_start: '2028-01-01', plan_end: '2028-01-31' },
  { wbs_code: 'A-09-01-01-001-02', category: '공통', major: '내장공사', middle: '천장공사', minor: '경량철골천장', activity: '천장 시공', task: '석고보드 설치', predecessor: 'A-09-01-01-001-01', successor: 'A-09-01-01-001-03', plan_start: '2028-02-01', plan_end: '2028-02-29' },
  { wbs_code: 'A-09-01-01-001-03', category: '공통', major: '내장공사', middle: '천장공사', minor: '경량철골천장', activity: '천장 시공', task: '천장 마감재 시공', predecessor: 'A-09-01-01-001-02', successor: 'A-09-02-01-001-01', plan_start: '2028-03-01', plan_end: '2028-03-31' },
  { wbs_code: 'A-09-02-01-001-01', category: '공통', major: '내장공사', middle: '바닥공사', minor: '온돌바닥', activity: '바닥 시공', task: '단열재 설치', predecessor: 'A-09-01-01-001-03', successor: 'A-09-02-01-001-02', plan_start: '2028-02-01', plan_end: '2028-02-29' },
  { wbs_code: 'A-09-02-01-001-02', category: '공통', major: '내장공사', middle: '바닥공사', minor: '온돌바닥', activity: '바닥 시공', task: '난방배관 설치', predecessor: 'A-09-02-01-001-01', successor: 'A-09-02-01-001-03', plan_start: '2028-03-01', plan_end: '2028-03-31' },
  { wbs_code: 'A-09-02-01-001-03', category: '공통', major: '내장공사', middle: '바닥공사', minor: '온돌바닥', activity: '바닥 시공', task: '마감 모르타르 타설', predecessor: 'A-09-02-01-001-02', successor: 'A-10-01-01-001-01', plan_start: '2028-04-01', plan_end: '2028-04-30' },
  // 도장공사
  { wbs_code: 'A-10-01-01-001-01', category: '공통', major: '도장공사', middle: '내부도장', minor: '벽체도장', activity: '내부 도장', task: '퍼티 작업', predecessor: 'A-09-02-01-001-03', successor: 'A-10-01-01-001-02', plan_start: '2028-04-01', plan_end: '2028-04-15' },
  { wbs_code: 'A-10-01-01-001-02', category: '공통', major: '도장공사', middle: '내부도장', minor: '벽체도장', activity: '내부 도장', task: '초벌 도장', predecessor: 'A-10-01-01-001-01', successor: 'A-10-01-01-001-03', plan_start: '2028-04-16', plan_end: '2028-05-15' },
  { wbs_code: 'A-10-01-01-001-03', category: '공통', major: '도장공사', middle: '내부도장', minor: '벽체도장', activity: '내부 도장', task: '재벌 도장 및 마감', predecessor: 'A-10-01-01-001-02', successor: 'A-11-01-01-001-01', plan_start: '2028-05-16', plan_end: '2028-06-15' },
  // 창호공사
  { wbs_code: 'A-11-01-01-001-01', category: '공통', major: '창호공사', middle: '외부창호', minor: '알루미늄창호', activity: '창호 설치', task: '창호 반입 및 검수', predecessor: 'A-10-01-01-001-03', successor: 'A-11-01-01-001-02', plan_start: '2027-12-01', plan_end: '2027-12-15' },
  { wbs_code: 'A-11-01-01-001-02', category: '공통', major: '창호공사', middle: '외부창호', minor: '알루미늄창호', activity: '창호 설치', task: '창호 설치 시공', predecessor: 'A-11-01-01-001-01', successor: 'A-11-01-01-001-03', plan_start: '2027-12-16', plan_end: '2028-02-29' },
  { wbs_code: 'A-11-01-01-001-03', category: '공통', major: '창호공사', middle: '외부창호', minor: '알루미늄창호', activity: '창호 설치', task: '창호 코킹 및 마감', predecessor: 'A-11-01-01-001-02', successor: 'A-12-01-01-001-01', plan_start: '2028-03-01', plan_end: '2028-03-31' },
  // 건축외장
  { wbs_code: 'A-12-01-01-001-01', category: '공통', major: '건축외장', middle: '외벽마감', minor: '드라이비트', activity: '외벽 마감 시공', task: '단열재 부착', predecessor: 'A-11-01-01-001-03', successor: 'A-12-01-01-001-02', plan_start: '2028-01-01', plan_end: '2028-01-31' },
  { wbs_code: 'A-12-01-01-001-02', category: '공통', major: '건축외장', middle: '외벽마감', minor: '드라이비트', activity: '외벽 마감 시공', task: '메쉬 부착 및 기초도포', predecessor: 'A-12-01-01-001-01', successor: 'A-12-01-01-001-03', plan_start: '2028-02-01', plan_end: '2028-02-29' },
  { wbs_code: 'A-12-01-01-001-03', category: '공통', major: '건축외장', middle: '외벽마감', minor: '드라이비트', activity: '외벽 마감 시공', task: '마감재 도포', predecessor: 'A-12-01-01-001-02', successor: 'A-13-01-01-001-01', plan_start: '2028-03-01', plan_end: '2028-04-30' },
  // 기계설비
  { wbs_code: 'A-13-01-01-001-01', category: '공통', major: '기계설비', middle: '급배수설비', minor: '급수배관', activity: '급수 배관 시공', task: '급수 주배관 설치', predecessor: 'A-05-01-01-001-05', successor: 'A-13-01-01-001-02', plan_start: '2027-01-01', plan_end: '2027-03-31' },
  { wbs_code: 'A-13-01-01-001-02', category: '공통', major: '기계설비', middle: '급배수설비', minor: '급수배관', activity: '급수 배관 시공', task: '세대 급수 분기', predecessor: 'A-13-01-01-001-01', successor: 'A-13-01-01-001-03', plan_start: '2027-04-01', plan_end: '2027-06-30' },
  { wbs_code: 'A-13-01-01-001-03', category: '공통', major: '기계설비', middle: '급배수설비', minor: '급수배관', activity: '급수 배관 시공', task: '급수 기구 설치', predecessor: 'A-13-01-01-001-02', successor: 'A-13-02-01-001-01', plan_start: '2027-07-01', plan_end: '2027-09-30' },
  { wbs_code: 'A-13-02-01-001-01', category: '공통', major: '기계설비', middle: '난방설비', minor: '세대난방', activity: '세대 난방 구축', task: '보일러 설치', predecessor: 'A-13-01-01-001-03', successor: 'A-13-02-01-001-02', plan_start: '2028-01-01', plan_end: '2028-02-29' },
  { wbs_code: 'A-13-02-01-001-02', category: '공통', major: '기계설비', middle: '난방설비', minor: '세대난방', activity: '세대 난방 구축', task: '난방 배관 연결', predecessor: 'A-13-02-01-001-01', successor: 'A-13-02-01-001-03', plan_start: '2028-03-01', plan_end: '2028-04-30' },
  { wbs_code: 'A-13-02-01-001-03', category: '공통', major: '기계설비', middle: '난방설비', minor: '세대난방', activity: '세대 난방 구축', task: '시운전 및 검사', predecessor: 'A-13-02-01-001-02', successor: 'A-14-01-01-001-01', plan_start: '2028-05-01', plan_end: '2028-05-31' },
  // 전기공사
  { wbs_code: 'A-14-01-01-001-01', category: '공통', major: '전기공사', middle: '수변전설비', minor: '변압기', activity: '수변전 설비 설치', task: '수변전실 구축', predecessor: 'A-05-01-01-001-05', successor: 'A-14-01-01-001-02', plan_start: '2027-01-01', plan_end: '2027-03-31' },
  { wbs_code: 'A-14-01-01-001-02', category: '공통', major: '전기공사', middle: '수변전설비', minor: '변압기', activity: '수변전 설비 설치', task: '변압기 설치', predecessor: 'A-14-01-01-001-01', successor: 'A-14-01-01-001-03', plan_start: '2027-04-01', plan_end: '2027-06-30' },
  { wbs_code: 'A-14-01-01-001-03', category: '공통', major: '전기공사', middle: '수변전설비', minor: '변압기', activity: '수변전 설비 설치', task: '배전반 설치 및 결선', predecessor: 'A-14-01-01-001-02', successor: 'A-14-02-01-001-01', plan_start: '2027-07-01', plan_end: '2027-09-30' },
  { wbs_code: 'A-14-02-01-001-01', category: '공통', major: '전기공사', middle: '세대전기', minor: '세대배선', activity: '세대 전기 배선', task: '전선관 설치', predecessor: 'A-14-01-01-001-03', successor: 'A-14-02-01-001-02', plan_start: '2027-10-01', plan_end: '2027-12-31' },
  { wbs_code: 'A-14-02-01-001-02', category: '공통', major: '전기공사', middle: '세대전기', minor: '세대배선', activity: '세대 전기 배선', task: '전선 입선', predecessor: 'A-14-02-01-001-01', successor: 'A-14-02-01-001-03', plan_start: '2028-01-01', plan_end: '2028-03-31' },
  { wbs_code: 'A-14-02-01-001-03', category: '공통', major: '전기공사', middle: '세대전기', minor: '세대배선', activity: '세대 전기 배선', task: '콘센트 및 스위치 설치', predecessor: 'A-14-02-01-001-02', successor: 'A-15-01-01-001-01', plan_start: '2028-04-01', plan_end: '2028-05-31' },
  // 소방공사
  { wbs_code: 'A-15-01-01-001-01', category: '공통', major: '소방공사', middle: '소화설비', minor: '스프링클러', activity: '스프링클러 시공', task: '주배관 설치', predecessor: 'A-05-01-01-001-05', successor: 'A-15-01-01-001-02', plan_start: '2027-01-01', plan_end: '2027-06-30' },
  { wbs_code: 'A-15-01-01-001-02', category: '공통', major: '소방공사', middle: '소화설비', minor: '스프링클러', activity: '스프링클러 시공', task: '헤드 설치', predecessor: 'A-15-01-01-001-01', successor: 'A-15-01-01-001-03', plan_start: '2027-07-01', plan_end: '2027-12-31' },
  { wbs_code: 'A-15-01-01-001-03', category: '공통', major: '소방공사', middle: '소화설비', minor: '스프링클러', activity: '스프링클러 시공', task: '수압 시험 및 검사', predecessor: 'A-15-01-01-001-02', successor: 'A-16-01-01-001-01', plan_start: '2028-01-01', plan_end: '2028-03-31' },
  // 정보통신
  { wbs_code: 'A-16-01-01-001-01', category: '공통', major: '정보통신', middle: '통신설비', minor: '통신배관', activity: '통신 배관 시공', task: '통신 배관 설치', predecessor: 'A-14-02-01-001-03', successor: 'A-16-01-01-001-02', plan_start: '2028-01-01', plan_end: '2028-03-31' },
  { wbs_code: 'A-16-01-01-001-02', category: '공통', major: '정보통신', middle: '통신설비', minor: '통신배관', activity: '통신 배관 시공', task: '통신 케이블 입선', predecessor: 'A-16-01-01-001-01', successor: 'A-16-01-01-001-03', plan_start: '2028-04-01', plan_end: '2028-05-31' },
  { wbs_code: 'A-16-01-01-001-03', category: '공통', major: '정보통신', middle: '통신설비', minor: '통신배관', activity: '통신 배관 시공', task: '단자함 및 기기 설치', predecessor: 'A-16-01-01-001-02', successor: 'A-17-01-01-001-01', plan_start: '2028-06-01', plan_end: '2028-06-30' },
  // 승강기공사
  { wbs_code: 'A-17-01-01-001-01', category: '공통', major: '승강기공사', middle: '엘리베이터', minor: '승강기설치', activity: '승강기 설치', task: '승강로 검사', predecessor: 'A-05-02-01-001-05', successor: 'A-17-01-01-001-02', plan_start: '2027-12-01', plan_end: '2027-12-31' },
  { wbs_code: 'A-17-01-01-001-02', category: '공통', major: '승강기공사', middle: '엘리베이터', minor: '승강기설치', activity: '승강기 설치', task: '승강기 기기 반입', predecessor: 'A-17-01-01-001-01', successor: 'A-17-01-01-001-03', plan_start: '2028-01-01', plan_end: '2028-02-29' },
  { wbs_code: 'A-17-01-01-001-03', category: '공통', major: '승강기공사', middle: '엘리베이터', minor: '승강기설치', activity: '승강기 설치', task: '승강기 설치 및 시운전', predecessor: 'A-17-01-01-001-02', successor: 'A-18-01-01-001-01', plan_start: '2028-03-01', plan_end: '2028-05-31' },
  // 외부토목
  { wbs_code: 'A-18-01-01-001-01', category: '공통', major: '외부토목', middle: '단지포장', minor: '아스팔트포장', activity: '단지 포장 시공', task: '노반 정지', predecessor: 'A-12-01-01-001-03', successor: 'A-18-01-01-001-02', plan_start: '2028-05-01', plan_end: '2028-05-31' },
  { wbs_code: 'A-18-01-01-001-02', category: '공통', major: '외부토목', middle: '단지포장', minor: '아스팔트포장', activity: '단지 포장 시공', task: '기층 포장', predecessor: 'A-18-01-01-001-01', successor: 'A-18-01-01-001-03', plan_start: '2028-06-01', plan_end: '2028-06-30' },
  { wbs_code: 'A-18-01-01-001-03', category: '공통', major: '외부토목', middle: '단지포장', minor: '아스팔트포장', activity: '단지 포장 시공', task: '표층 포장', predecessor: 'A-18-01-01-001-02', successor: 'A-19-01-01-001-01', plan_start: '2028-07-01', plan_end: '2028-07-31' },
  // 조경공사
  { wbs_code: 'A-19-01-01-001-01', category: '공통', major: '조경공사', middle: '식재공사', minor: '교목식재', activity: '수목 식재', task: '교목 반입 및 식재', predecessor: 'A-18-01-01-001-03', successor: 'A-19-01-01-001-02', plan_start: '2028-07-01', plan_end: '2028-08-31' },
  { wbs_code: 'A-19-01-01-001-02', category: '공통', major: '조경공사', middle: '식재공사', minor: '교목식재', activity: '수목 식재', task: '관목 및 지피식물 식재', predecessor: 'A-19-01-01-001-01', successor: 'A-19-01-01-001-03', plan_start: '2028-09-01', plan_end: '2028-09-30' },
  { wbs_code: 'A-19-01-01-001-03', category: '공통', major: '조경공사', middle: '식재공사', minor: '교목식재', activity: '수목 식재', task: '잔디 식재 및 마감', predecessor: 'A-19-01-01-001-02', successor: 'A-20-01-01-001-01', plan_start: '2028-10-01', plan_end: '2028-10-31' },
  // 준공단계
  { wbs_code: 'A-20-01-01-001-01', category: '공통', major: '준공단계', middle: '준공검사', minor: '사용검사', activity: '입주자 점검 대응', task: '세대 사전점검 실시', predecessor: 'A-19-01-01-001-03', successor: 'A-20-01-01-001-02', plan_start: '2028-10-01', plan_end: '2028-10-31' },
  { wbs_code: 'A-20-01-01-001-02', category: '공통', major: '준공단계', middle: '준공검사', minor: '사용검사', activity: '입주자 점검 대응', task: '하자 보수 완료', predecessor: 'A-20-01-01-001-01', successor: 'A-20-01-01-001-03', plan_start: '2028-11-01', plan_end: '2028-11-30' },
  { wbs_code: 'A-20-01-01-001-03', category: '공통', major: '준공단계', middle: '준공검사', minor: '사용검사', activity: '입주자 점검 대응', task: '사용검사 신청 및 완료', predecessor: 'A-20-01-01-001-02', successor: 'A-20-02-01-001-01', plan_start: '2028-12-01', plan_end: '2028-12-20' },
  { wbs_code: 'A-20-02-01-001-01', category: '공통', major: '준공단계', middle: '운영이관', minor: '관리이관', activity: '운영 이관', task: '관리사무소 인수인계', predecessor: 'A-20-01-01-001-03', successor: 'A-20-02-01-001-02', plan_start: '2028-12-21', plan_end: '2028-12-25' },
  { wbs_code: 'A-20-02-01-001-02', category: '공통', major: '준공단계', middle: '운영이관', minor: '관리이관', activity: '운영 이관', task: '입주 개시', predecessor: 'A-20-02-01-001-01', successor: '-', plan_start: '2028-12-26', plan_end: '2029-01-01' },
];

// 프로젝트 생성
await connection.execute(`
  INSERT IGNORE INTO projects (code, name, description, status) VALUES 
  ('PDC-2025', '판교 데이터센터 신축', '판교 데이터센터 신축 공사 프로젝트', 'active'),
  ('ILC-2025', '인천 물류센터 증축', '인천 물류센터 증축 공사 프로젝트', 'active'),
  ('SOF-2024', '서울 오피스 리모델링', '서울 오피스 리모델링 프로젝트', 'active')
`);

const [projectRows] = await connection.execute('SELECT * FROM projects');
const project = projectRows[0];
const projectId = project.id;

console.log(`Project ID: ${projectId}`);

// 기존 WBS 데이터 삭제
await connection.execute('DELETE FROM wbs_items WHERE projectId = ?', [projectId]);

// 계층 구조 생성
const hierarchyMap = new Map(); // key: "major|middle|minor|activity", value: id

let sortOrder = 0;

// 1단계: 대공종 생성
const majors = [...new Set(wbsRawData.map(d => d.major))];
const majorIds = new Map();
for (const major of majors) {
  const tasks = wbsRawData.filter(d => d.major === major);
  const planStart = tasks.map(t => t.plan_start).sort()[0];
  const planEnd = tasks.map(t => t.plan_end).sort().reverse()[0];
  const [result] = await connection.execute(
    `INSERT INTO wbs_items (projectId, wbsCode, level, parentId, sortOrder, name, category, planStart, planEnd, progress, status) VALUES (?, ?, 'major', NULL, ?, ?, '공통', ?, ?, 0, 'not_started')`,
    [projectId, `M-${major}`, ++sortOrder, major, planStart, planEnd]
  );
  majorIds.set(major, result.insertId);
}

// 2단계: 중공종 생성
const middleIds = new Map();
const middles = [...new Set(wbsRawData.map(d => `${d.major}|${d.middle}`))];
for (const key of middles) {
  const [major, middle] = key.split('|');
  const tasks = wbsRawData.filter(d => d.major === major && d.middle === middle);
  const planStart = tasks.map(t => t.plan_start).sort()[0];
  const planEnd = tasks.map(t => t.plan_end).sort().reverse()[0];
  const parentId = majorIds.get(major);
  const [result] = await connection.execute(
    `INSERT INTO wbs_items (projectId, wbsCode, level, parentId, sortOrder, name, category, planStart, planEnd, progress, status) VALUES (?, ?, 'middle', ?, ?, ?, '공통', ?, ?, 0, 'not_started')`,
    [projectId, `MM-${major}-${middle}`, ++sortOrder, parentId, middle, planStart, planEnd]
  );
  middleIds.set(key, result.insertId);
}

// 3단계: 소공종 생성
const minorIds = new Map();
const minors = [...new Set(wbsRawData.map(d => `${d.major}|${d.middle}|${d.minor}`))];
for (const key of minors) {
  const [major, middle, minor] = key.split('|');
  const tasks = wbsRawData.filter(d => d.major === major && d.middle === middle && d.minor === minor);
  const planStart = tasks.map(t => t.plan_start).sort()[0];
  const planEnd = tasks.map(t => t.plan_end).sort().reverse()[0];
  const parentId = middleIds.get(`${major}|${middle}`);
  const [result] = await connection.execute(
    `INSERT INTO wbs_items (projectId, wbsCode, level, parentId, sortOrder, name, category, planStart, planEnd, progress, status) VALUES (?, ?, 'minor', ?, ?, ?, '공통', ?, ?, 0, 'not_started')`,
    [projectId, `MN-${major}-${middle}-${minor}`, ++sortOrder, parentId, minor, planStart, planEnd]
  );
  minorIds.set(key, result.insertId);
}

// 4단계: 액티비티 생성
const activityIds = new Map();
const activities = [...new Set(wbsRawData.map(d => `${d.major}|${d.middle}|${d.minor}|${d.activity}`))];
for (const key of activities) {
  const [major, middle, minor, activity] = key.split('|');
  const tasks = wbsRawData.filter(d => d.major === major && d.middle === middle && d.minor === minor && d.activity === activity);
  const planStart = tasks.map(t => t.plan_start).sort()[0];
  const planEnd = tasks.map(t => t.plan_end).sort().reverse()[0];
  const parentId = minorIds.get(`${major}|${middle}|${minor}`);
  const [result] = await connection.execute(
    `INSERT INTO wbs_items (projectId, wbsCode, level, parentId, sortOrder, name, category, planStart, planEnd, progress, status) VALUES (?, ?, 'activity', ?, ?, ?, '공통', ?, ?, 0, 'not_started')`,
    [projectId, `A-${major}-${middle}-${minor}-${activity}`, ++sortOrder, parentId, activity, planStart, planEnd]
  );
  activityIds.set(key, result.insertId);
}

// 5단계: 테스크 생성
for (const row of wbsRawData) {
  const actKey = `${row.major}|${row.middle}|${row.minor}|${row.activity}`;
  const parentId = activityIds.get(actKey);
  await connection.execute(
    `INSERT INTO wbs_items (projectId, wbsCode, level, parentId, sortOrder, name, category, planStart, planEnd, progress, status, predecessorCode, successorCode) VALUES (?, ?, 'task', ?, ?, ?, ?, ?, ?, 0, 'not_started', ?, ?)`,
    [projectId, row.wbs_code, ++sortOrder, parentId, row.task, row.category, row.plan_start, row.plan_end, row.predecessor === '-' ? null : row.predecessor, row.successor === '-' ? null : row.successor]
  );
}

// 샘플 사용자 생성 (시연용)
const sampleUsers = [
  { openId: 'demo-kim', name: '김현장', email: 'kim@smartpms.com', role: 'admin' },
  { openId: 'demo-lee', name: '이관리', email: 'lee@smartpms.com', role: 'user' },
  { openId: 'demo-park', name: '박공무', email: 'park@smartpms.com', role: 'user' },
  { openId: 'demo-choi', name: '최시공', email: 'choi@smartpms.com', role: 'user' },
  { openId: 'demo-jung', name: '정안전', email: 'jung@smartpms.com', role: 'user' },
  { openId: 'demo-han', name: '한설비', email: 'han@smartpms.com', role: 'user' },
  { openId: 'demo-oh', name: '오구조', email: 'oh@smartpms.com', role: 'user' },
];

for (const u of sampleUsers) {
  await connection.execute(
    `INSERT IGNORE INTO users (openId, name, email, role, lastSignedIn) VALUES (?, ?, ?, ?, NOW())`,
    [u.openId, u.name, u.email, u.role]
  );
}

// 샘플 이슈 생성
const [userRows] = await connection.execute('SELECT id, name FROM users WHERE openId LIKE "demo-%"');
const demoUsers = userRows;
if (demoUsers.length > 0) {
  const [wbsRows] = await connection.execute('SELECT id FROM wbs_items WHERE projectId = ? AND level = "task" LIMIT 5', [projectId]);
  const wbsItems = wbsRows;
  
  const sampleIssues = [
    { title: '가설울타리 설치 지연', description: '자재 납품 지연으로 인한 가설울타리 설치 일정 지연', type: 'risk', priority: 'high', status: 'open' },
    { title: '지하 배수 불량', description: '집중호우로 인한 지하 배수 불량 발생', type: 'defect', priority: 'critical', status: 'in_progress' },
    { title: '도면 변경 요청', description: '발주처 요청에 의한 평면 도면 변경', type: 'request', priority: 'medium', status: 'open' },
    { title: '안전 난간 설치 누락', description: '3층 개구부 안전 난간 미설치 확인', type: 'defect', priority: 'high', status: 'resolved' },
    { title: '콘크리트 타설 품질 검사', description: '지하 2층 콘크리트 타설 후 품질 검사 필요', type: 'question', priority: 'medium', status: 'closed' },
  ];

  for (let i = 0; i < sampleIssues.length; i++) {
    const issue = sampleIssues[i];
    const reporter = demoUsers[i % demoUsers.length];
    const assignee = demoUsers[(i + 1) % demoUsers.length];
    const wbsItem = wbsItems[i % wbsItems.length];
    
    await connection.execute(
      `INSERT INTO issues (projectId, wbsItemId, title, description, type, priority, status, reporterId, assigneeId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, wbsItem?.id, issue.title, issue.description, issue.type, issue.priority, issue.status, reporter.id, assignee.id]
    );
  }
}

console.log('Seeding completed!');
console.log(`- Projects: 3`);
console.log(`- WBS Items: ${wbsRawData.length} tasks + hierarchy`);
console.log(`- Users: ${sampleUsers.length}`);
console.log(`- Issues: 5 sample issues`);

await connection.end();
