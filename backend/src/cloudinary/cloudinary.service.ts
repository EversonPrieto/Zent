import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary credentials:', {
        cloudName,
        apiKey,
        apiSecret,
      });
      throw new BadRequestException(
        'Cloudinary não está configurado corretamente',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    options: any = {},
  ): Promise<UploadApiResponse> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    try {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      const uploadOptions = {
        folder: 'zent/workspaces',
        resource_type: 'image' as const,
        ...options,
      };

      console.log('Uploading to Cloudinary with options:', {
        folder: uploadOptions.folder,
      });

      return await cloudinary.uploader.upload(base64, uploadOptions);
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }
}
