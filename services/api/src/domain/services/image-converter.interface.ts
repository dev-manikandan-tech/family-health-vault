export interface ConvertOptions {
  targetFormat?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  fit?: 'cover' | 'contain' | 'fill';
}

export interface IImageConverter {
  supports(mimeType: string): boolean;
  convert(input: Buffer, options?: ConvertOptions): Promise<Buffer>;
  generateThumbnail(input: Buffer, options: ThumbnailOptions): Promise<Buffer>;
  getMetadata?(
    input: Buffer,
  ):
    | Promise<{ width?: number; height?: number }>
    | { width?: number; height?: number };
}
