import {
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from "dotenv";
import { readFileSync, unlinkSync } from "fs";
import path from "path";
import { CustomError } from "./customError.util";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

export const uploadToS3 = async (
  key: string,
  filePath: string,
  contentType: string
): Promise<PutObjectCommandOutput | undefined> => {
  try {
    //TODO: Add logic to delete file after successful upload
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: readFileSync(filePath),
      ContentType: contentType,
    };
    const command = new PutObjectCommand(params);
    const response = await s3.send(command);
    //TODO: if response is successful remove image/video from file system(public/temp folder) using fsUnlinkSync
    if (response) {
      try {
        unlinkSync(filePath);
      } catch (error) {
        new CustomError(
          500,
          "Failed To delete Local File After Successfull Upload!"
        );
      }
    }
    return response;
  } catch (error) {
    //TODO: If error, first remove the image/video from file system using fsUnlinkSync
    try {
      unlinkSync(filePath);
    } catch (error) {
      new CustomError(
        500,
        "Failed To delete Local File After Successfull Upload!"
      );
    }
    //TODO: Throw error using new CustomError and remove this clg
    console.log("Error Occurred While Uploading Object on S3:\n", error);
  }
};

export const getUrlFromS3 = async (
  key: string
): Promise<string | undefined> => {
  try {
    const getObjectParams = {
      Bucket: bucketName,
      Key: key,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
  } catch (error) {
    //TODO: Add throw error and remove this clg
    console.log(
      "Error Occurred while Getting Pre-Signed URL from S3: \n",
      error
    );
  }
};

export const deleteFromS3 = async (
  key: string
): Promise<DeleteObjectCommandOutput | undefined> => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    const command = new DeleteObjectCommand(params);
    const response = await s3.send(command);
    return response;
  } catch (error) {
    //TODO: Throw error and remove clg
    console.log("Error Occurred while Deleting  Object From S3: \n", error);
  }
};
