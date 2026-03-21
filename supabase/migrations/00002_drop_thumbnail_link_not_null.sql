-- drive_thumbnail_link는 만료되는 Google Drive 임시 URL이므로 컬럼 완전 제거
-- driveFileId를 통해 동적으로 썸네일을 조회하는 구조로 전환
ALTER TABLE photos DROP COLUMN drive_thumbnail_link;
