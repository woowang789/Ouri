export interface User {
  id: string;
  nickname: string;
  googleDriveConnected: boolean;
  googleDriveFolderId: string | null;
  createdAt: string;
  updatedAt: string;
}
