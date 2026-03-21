// 갤러리에서 선택한 사진 (업로드 전)
export interface SelectedPhoto {
  localUri: string;
  takenAt: string | null;
  takenLat: number | null;
  takenLng: number | null;
  takenLocationName: string | null;
}

export interface Photo {
  id: string;
  tripId: string;
  driveFileId: string;
  takenAt: string;
  takenLat: number | null;
  takenLng: number | null;
  takenLocationName: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
