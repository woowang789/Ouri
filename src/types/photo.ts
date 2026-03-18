export interface Photo {
  id: string;
  tripId: string;
  driveFileId: string;
  driveThumbnailLink: string;
  takenAt: string;
  takenLat: number | null;
  takenLng: number | null;
  takenLocationName: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
