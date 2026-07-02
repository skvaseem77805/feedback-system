import { NextRequest } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return Response.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "feedback-system",
    });

    return Response.json({
      url: result.secure_url,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Image upload failed" },
      { status: 500 }
    );
  }
}