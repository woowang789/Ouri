import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const OURI_FOLDER_NAME = 'Ouri';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const SIMPLE_UPLOAD_LIMIT = 5 * 1024 * 1024; // 5MB

// Google Access Token 획득 (Drive API 호출용)
export async function getAccessToken(): Promise<string> {
  try {
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch {
    // 토큰이 없거나 만료된 경우 자동 갱신 시도
    try {
      await GoogleSignin.signInSilently();
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch {
      throw new Error('Google 액세스 토큰을 가져올 수 없습니다');
    }
  }
}

// Google Drive REST API 인증 요청 래퍼
async function driveRequest<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${DRIVE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Google 인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    throw new Error(`Google Drive API 오류 (${response.status}): ${response.statusText}`);
  }

  // DELETE 등 응답 본문이 없는 경우
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// Ouri 전용 폴더 조회/생성
export async function getOrCreateOuriFolder(): Promise<string> {
  const query = `name='${OURI_FOLDER_NAME}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`;
  const result = await driveRequest<{ files: { id: string; name: string }[] }>(
    `/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
  );

  if (result.files.length > 0) {
    return result.files[0].id;
  }

  // 폴더가 없으면 새로 생성
  const created = await driveRequest<{ id: string }>(
    '/files',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: OURI_FOLDER_NAME,
        mimeType: FOLDER_MIME_TYPE,
      }),
    },
  );

  return created.id;
}

// Ouri 폴더 내 파일 용량 합계 조회 (drive.file 스코프 호환)
export async function getDriveStorageQuota(): Promise<{ used: number }> {
  const query = `name='${OURI_FOLDER_NAME}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`;
  const folderResult = await driveRequest<{ files: { id: string }[] }>(
    `/files?q=${encodeURIComponent(query)}&fields=files(id)`,
  );

  if (folderResult.files.length === 0) {
    return { used: 0 };
  }

  const folderId = folderResult.files[0].id;
  let used = 0;
  let pageToken: string | undefined;

  do {
    const filesQuery = `'${folderId}' in parents and trashed=false`;
    let url = `/files?q=${encodeURIComponent(filesQuery)}&fields=files(size),nextPageToken&pageSize=1000`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const result = await driveRequest<{
      files: { size?: string }[];
      nextPageToken?: string;
    }>(url);

    for (const file of result.files) {
      if (file.size) used += Number(file.size);
    }
    pageToken = result.nextPageToken;
  } while (pageToken);

  return { used };
}

// Google Drive 파일 삭제
export async function deleteDriveFile(fileId: string): Promise<void> {
  await driveRequest(`/files/${fileId}`, { method: 'DELETE' });
}

// Supabase users 테이블에 Drive 폴더 ID 저장
export async function updateUserDriveFolderId(
  userId: string,
  folderId: string,
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ google_drive_folder_id: folderId })
    .eq('id', userId);

  if (error) throw new Error(`Drive 연동 정보 업데이트 실패: ${error.message}`);
}

// Google Drive에 파일 업로드 (5MB 기준 Simple/Resumable 분기)
export async function uploadFileToDrive(
  localUri: string,
  fileName: string,
  mimeType: string,
  folderId: string,
): Promise<{ fileId: string; thumbnailLink: string }> {
  const fileInfo = await FileSystem.getInfoAsync(localUri);
  if (!fileInfo.exists) {
    throw new Error('업로드할 파일을 찾을 수 없습니다');
  }

  const accessToken = await getAccessToken();
  const metadata = { name: fileName, parents: [folderId] };
  let fileId: string;

  if (fileInfo.size && fileInfo.size > SIMPLE_UPLOAD_LIMIT) {
    // Resumable Upload (5MB 초과)
    fileId = await resumableUpload(accessToken, localUri, metadata, mimeType);
  } else {
    // Simple Multipart Upload (5MB 이하)
    fileId = await simpleUpload(accessToken, localUri, metadata, mimeType);
  }

  // 썸네일 링크 조회 (비동기 생성이므로 즉시 없을 수 있음)
  let thumbnailLink = '';
  try {
    const fileData = await driveRequest<{ thumbnailLink?: string }>(
      `/files/${fileId}?fields=thumbnailLink`,
    );
    thumbnailLink = fileData.thumbnailLink ?? '';
  } catch {
    // 썸네일 조회 실패 시 빈 문자열
  }

  return { fileId, thumbnailLink };
}

// Simple Multipart Upload (multipart/related)
async function simpleUpload(
  accessToken: string,
  localUri: string,
  metadata: { name: string; parents: string[] },
  mimeType: string,
): Promise<string> {
  const fileBase64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const boundary = 'ouri_upload_boundary';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n` +
    `${fileBase64}\r\n` +
    `--${boundary}--`;

  const response = await fetch(
    `${UPLOAD_API}/files?uploadType=multipart`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(`사진 업로드 실패 (${response.status}): ${response.statusText}`);
  }

  const result = (await response.json()) as { id: string };
  return result.id;
}

// Resumable Upload (5MB 초과 대응)
async function resumableUpload(
  accessToken: string,
  localUri: string,
  metadata: { name: string; parents: string[] },
  mimeType: string,
): Promise<string> {
  // Step 1: 업로드 세션 시작
  const initResponse = await fetch(
    `${UPLOAD_API}/files?uploadType=resumable`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!initResponse.ok) {
    throw new Error(`사진 업로드 세션 시작 실패 (${initResponse.status})`);
  }

  const uploadUri = initResponse.headers.get('Location');
  if (!uploadUri) {
    throw new Error('사진 업로드 세션 URI를 받지 못했습니다');
  }

  // Step 2: 파일 전송 (단일 청크)
  const fileBase64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const uploadResponse = await fetch(uploadUri, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Content-Transfer-Encoding': 'base64',
    },
    body: fileBase64,
  });

  if (!uploadResponse.ok) {
    throw new Error(`사진 업로드 실패 (${uploadResponse.status}): ${uploadResponse.statusText}`);
  }

  const result = (await uploadResponse.json()) as { id: string };
  return result.id;
}
