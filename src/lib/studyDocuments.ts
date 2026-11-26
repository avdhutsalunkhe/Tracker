import { supabase, isSupabaseConfigured } from './supabase';

export type StudyDocCategory =
  | 'Notes'
  | 'DPP'
  | 'Practice Questions'
  | 'Test Questions';

export interface StudyDocument {
  id: string;
  user_id: string;
  paper: 'DA' | 'CS';
  subject_id?: string | null;
  topic_id?: string | null;
  category: StudyDocCategory;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  solved: boolean;
  created_at: string;
}

const BUCKET = 'study-files';
const CACHE_PREFIX = 'avdhut_study_docs_cache_';

export function getCachedStudyDocuments(userId: string): StudyDocument[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCachedStudyDocuments(userId: string, docs: StudyDocument[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${userId}`, JSON.stringify(docs));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchStudyDocuments(userId: string): Promise<StudyDocument[]> {
  if (!userId || !isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('study_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const docs = (data || []) as StudyDocument[];
  setCachedStudyDocuments(userId, docs);
  return docs;
}

export async function uploadStudyDocument(params: {
  userId: string;
  file: File;
  paper: 'DA' | 'CS';
  subjectId?: string | null;
  topicId?: string | null;
  category: StudyDocCategory;
}): Promise<StudyDocument> {
  const { userId, file, paper, subjectId, topicId, category } = params;
  if (!userId || !isSupabaseConfigured || !supabase) {
    throw new Error('Sign in with your Supabase account to upload documents.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const folder = category.toLowerCase().replace(/\s+/g, '-');
  const storagePath = `${userId}/${folder}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) throw uploadError;

  const cleanTitle = file.name.replace(/\.(md|markdown|txt|pdf|ppt|pptx)$/i, '').trim() || file.name;
  const ext = file.name.split('.').pop()?.toLowerCase() || 'file';

  const { data: inserted, error: insertError } = await supabase
    .from('study_documents')
    .insert({
      user_id: userId,
      paper,
      subject_id: subjectId || null,
      topic_id: topicId || null,
      category,
      title: cleanTitle,
      file_name: file.name,
      file_type: ext,
      file_size: file.size,
      storage_path: storagePath,
      solved: false,
    })
    .select()
    .single();

  if (insertError) {
    // Roll back uploaded file if DB insert fails
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
    throw insertError;
  }

  const doc = inserted as StudyDocument;
  const existing = getCachedStudyDocuments(userId);
  setCachedStudyDocuments(userId, [doc, ...existing]);
  return doc;
}

export async function getStudyDocumentUrl(storagePath: string): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) {
    throw error || new Error('Could not generate download URL.');
  }
  return data.signedUrl;
}

export async function fetchStudyDocumentText(storagePath: string): Promise<string> {
  const url = await getStudyDocumentUrl(storagePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load markdown file from Supabase.');
  return res.text();
}

export async function toggleStudyDocumentSolved(
  userId: string,
  id: string,
  solved: boolean
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from('study_documents')
    .update({ solved })
    .eq('id', id);
  if (error) throw error;

  const updated = getCachedStudyDocuments(userId).map((d) =>
    d.id === id ? { ...d, solved } : d
  );
  setCachedStudyDocuments(userId, updated);
}

export async function deleteStudyDocument(
  userId: string,
  doc: StudyDocument
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error: dbError } = await supabase
    .from('study_documents')
    .delete()
    .eq('id', doc.id);
  if (dbError) throw dbError;

  await supabase.storage.from(BUCKET).remove([doc.storage_path]).catch(() => {});

  const updated = getCachedStudyDocuments(userId).filter((d) => d.id !== doc.id);
  setCachedStudyDocuments(userId, updated);
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
