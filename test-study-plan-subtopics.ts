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

  await supabase.from('subjects').upsert({ id: subjectId, user_id: userId, name: 'Computer Science' });
  await supabase.from('topics').upsert({ id: topicId, user_id: userId, subject_id: subjectId, name: 'Tuples' });
  await supabase.from('exams').upsert({ id: examId, user_id: userId, subject_id: subjectId, exam_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });

  const plan = await StudyPlanService.generateStudyPlan(userId, examId);
  const taskWithTopic = plan.tasks.find(t => t.topic_id === topicId);
  console.log(JSON.stringify(taskWithTopic, null, 2));
}
runTest().catch(console.error);
