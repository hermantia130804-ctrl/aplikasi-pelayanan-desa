
import { minioClient } from "@/lib/minio";
import { randomUUID } from 'crypto';


export async function uploadFile(file: File, bucketName: string): Promise<string> {
  try {
    // Pastikan bucket sudah ada
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      await minioClient.setBucketPolicy(
        bucketName,
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        })
      );
    }

    // Konversi File ke Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate nama file unik
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${bucketName}-${randomUUID()}.${fileExtension}`;
    const objectName = `${bucketName}/${fileName}`;

    // Upload file ke MinIO
    await minioClient.putObject(bucketName, objectName, buffer, file.size);
    console.log(`File uploaded to MinIO: ${objectName}`);
    // Generate URL untuk mengakses file
    const fileUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${objectName}`;
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw new Error('Gagal mengunggah dokumen');
  }
}

export async function deleteFile(url: string, bucketName: string): Promise<void> {
  try {
    const objectName = url.split(`/${bucketName}/`)[1];
    if (!objectName) return;
    
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw new Error('Gagal menghapus dokumen');
  }
}