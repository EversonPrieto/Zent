import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';


@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return cloudinary.uploader.upload(base64, {
      folder: 'zent/workspaces',
      resource_type: 'image',
    });
  }
}