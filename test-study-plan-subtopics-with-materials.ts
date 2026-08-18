import { StudyPlanService } from './src/server/services/studyPlanService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function runTest() {
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  if (!users || users.length === 0) return console.log("no users");
  const userId = users[0].id;

  const subjectId = '22222222-2222-2222-2222-222222222222';
  const topicId = '33333333-3333-3333-3333-333333333333';
  const examId = '44444444-4444-4444-4444-444444444444';

  await supabase.from('study_materials').upsert({
    id: '55555555-5555-5555-5555-555555555555',
    user_id: userId,
    subject_id: subjectId,
    material_type: 'pyq',
    title: '2023 CS Past Paper',
    file_name: '2023_cs.pdf',
    file_path: 'test',
    file_type: 'application/pdf',
    file_size: 1000,
    extraction_status: 'completed',
    extracted_text: 'Q1. What is a tuple? Q2. Explain the difference between lists and tuples. Q3. Can you slice a tuple?',
  });

  await supabase.from('study_materials').upsert({
    id: '66666666-6666-6666-6666-666666666666',
    user_id: userId,
    subject_id: subjectId,
    topic_id: topicId,
    material_type: 'note',
    title: 'Tuples Notes',
    file_name: 'tuples.txt',
    file_path: 'test',
    file_type: 'text/plain',
    file_size: 500,
    extraction_status: 'completed',
    extracted_text: 'Tuples are immutable sequences in Python. You can create them with parentheses. Example: (1, 2, 3). You can unpack tuples into variables. Tuples support slicing like lists, but you cannot modify them after creation.',
  });

  const plan = await StudyPlanService.generateStudyPlan(userId, examId);
  const taskWithTopic = plan.tasks.find(t => t.topic_id === topicId);
  console.log(JSON.stringify(taskWithTopic, null, 2));
}
runTest().catch(console.error);
