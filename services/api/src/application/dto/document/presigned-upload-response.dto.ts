export class PresignedUploadResponseDto {
  documentId: string;
  uploadUrl: string;
  originalKey: string;
  expiresInSeconds: number;
}
