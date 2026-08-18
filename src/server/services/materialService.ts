import { createClient } from "@supabase/supabase-js";
import { StudyMaterial } from "../../shared/types";
import { MaterialExtractionService } from "./materialExtractionService";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class MaterialService {
  static async uploadMaterial(
    userId: string,
    subjectId: string,
    topicId: string | null,
    materialType: 'note' | 'pyq',
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    fileSize: number
  ): Promise<StudyMaterial> {
    // Validate subject ownership
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .eq("user_id", userId)
      .single();

    if (subjectError || !subject) {
      throw new Error("Subject not found or does not belong to you.");
    }

    // Validate topic if applicable
    if (materialType === 'note') {
      if (!topicId) throw new Error("topic_id is required for notes.");
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("id")
        .eq("id", topicId)
        .eq("subject_id", subjectId)
        .eq("user_id", userId)
        .single();
        
      if (topicError || !topic) {
        throw new Error("Topic not found or does not belong to the given subject/user.");
      }
    } else if (materialType === 'pyq') {
      if (topicId) throw new Error("topic_id must be null for PYQs.");
    } else {
      throw new Error("Invalid material type.");
    }

    // Generate unique storage path
    const fileUuid = crypto.randomUUID();
    const extension = fileName.split('.').pop() || '';
    const safeExtension = extension ? `.${extension}` : '';
    const folderTopic = topicId || 'pyq';
    const filePath = `${userId}/${subjectId}/${folderTopic}/${fileUuid}${safeExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("study_materials")
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: false
      });

    if (uploadError || !uploadData) {
      throw new Error("Failed to upload file to storage: " + uploadError?.message);
    }

    // Insert metadata into Postgres
    const { data: material, error: insertError } = await supabase
      .from("study_materials")
      .insert({
        user_id: userId,
        subject_id: subjectId,
        topic_id: topicId,
        material_type: materialType,
        title: fileName, // Using filename as default title
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize
      })
      .select()
      .single();

    if (insertError) {
      // Rollback storage if DB insert fails
      await supabase.storage.from("study_materials").remove([filePath]);
      throw new Error("Failed to save material metadata.");
    }

    // Fire and forget text extraction (runs asynchronously so we don't block the HTTP response)
    this.processExtractionAsync(material.id, userId, fileBuffer, fileType).catch(err => {
      console.error(`Unhandled error during async extraction for ${material.id}:`, err);
    });

    return material;
  }

  private static async processExtractionAsync(materialId: string, userId: string, buffer: Buffer, mimeType: string) {
    try {
      // Mark as processing
      await supabase.from("study_materials").update({
        extraction_status: 'processing'
      }).eq('id', materialId).eq('user_id', userId);

      // Extract text
      const { text, truncated } = await MaterialExtractionService.extractText(buffer, mimeType);
      
      // Update with success
      await supabase.from("study_materials").update({
        extracted_text: text,
        extraction_status: 'completed',
        extracted_at: new Date().toISOString(),
        extraction_truncated: truncated
      }).eq('id', materialId).eq('user_id', userId);

    } catch (err: any) {
      // Update with failure
      await supabase.from("study_materials").update({
        extraction_status: 'failed',
        extraction_error: err.message || 'Unknown extraction error',
        extracted_at: new Date().toISOString()
      }).eq('id', materialId).eq('user_id', userId);
    }
  }

  static async getMaterials(userId: string, subjectId: string, topicId?: string): Promise<StudyMaterial[]> {
    let query = supabase
      .from("study_materials")
      .select("id, user_id, subject_id, topic_id, material_type, title, file_name, file_path, file_type, file_size, created_at, updated_at, extraction_status, extraction_error, extracted_at, extraction_truncated")
      .eq("user_id", userId)
      .eq("subject_id", subjectId);

    if (topicId) {
      query = query.eq("topic_id", topicId);
    } else {
      query = query.is("topic_id", null);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch materials: " + error.message);
    }

    return data || [];
  }

  static async deleteMaterial(userId: string, materialId: string): Promise<void> {
    // Verify ownership and get file_path
    const { data: material, error: fetchError } = await supabase
      .from("study_materials")
      .select("file_path")
      .eq("id", materialId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !material) {
      throw new Error("Material not found or access denied.");
    }

    // Delete metadata first
    const { error: deleteError } = await supabase
      .from("study_materials")
      .delete()
      .eq("id", materialId)
      .eq("user_id", userId);

    if (deleteError) {
      throw new Error("Failed to delete material metadata.");
    }

    // Then delete storage object
    const { error: storageError } = await supabase
      .storage
      .from("study_materials")
      .remove([material.file_path]);

    if (storageError) {
      console.error("Failed to delete storage object, but metadata was removed:", storageError);
      // We don't throw here to avoid failing the whole request if only storage cleanup fails
    }
  }

  static async getDownloadUrl(userId: string, materialId: string): Promise<string> {
    // Verify ownership
    const { data: material, error: fetchError } = await supabase
      .from("study_materials")
      .select("file_path, file_name")
      .eq("id", materialId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !material) {
      throw new Error("Material not found or access denied.");
    }

    // Generate signed URL (valid for 60 seconds)
    const { data, error } = await supabase
      .storage
      .from("study_materials")
      .createSignedUrl(material.file_path, 60, {
        download: material.file_name
      });

    if (error || !data) {
      throw new Error("Failed to generate download URL.");
    }

    return data.signedUrl;
  }
}
