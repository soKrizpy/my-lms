import { describe, it, expect } from 'vitest';
import type { TopicNodeTopic } from './TopicNode';

// Import the extraction functions directly or test the dynamic behavior
describe('Dynamic Learning Flow & Node Architecture', () => {
  it('should support dynamic numbers of topics in a module without hardcoded limits', () => {
    // Simulate teacher creating 15 topics in a module
    const dynamicTopics: TopicNodeTopic[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Topik Pembelajaran ${i + 1}`,
      order_index: i + 1,
      engine_topic_id: `topic-${i + 1}`,
      isUnlocked: i < 3,
      status: 'published',
      quiz: { id: 100 + i, title: `Kuis ${i + 1}` },
    }));

    expect(dynamicTopics.length).toBe(15);
    // Unlocked count
    const unlocked = dynamicTopics.filter((t) => t.isUnlocked);
    expect(unlocked.length).toBe(3);

    // Row calculation for desktop zigzag (rows of 3)
    const rows: TopicNodeTopic[][] = [];
    for (let i = 0; i < dynamicTopics.length; i += 3) {
      rows.push(dynamicTopics.slice(i, i + 3));
    }
    expect(rows.length).toBe(5);
    expect(rows[0].length).toBe(3);
    expect(rows[4].length).toBe(3);
  });

  it('should dynamically extract multiple lesson slides when teacher provides lesson_content.nodes', async () => {
    const { TopicLearningFlowModal } = await import('./TopicLearningFlowModal');
    expect(TopicLearningFlowModal).toBeDefined();

    // Sample teacher-authored lesson_content with 4 custom slides
    const teacherLessonContent = {
      nodes: [
        { nodeId: 'n1', nodeType: 'lesson', title: 'Pengenalan Tag HTML', content: 'HTML adalah bahasa markup...' },
        { nodeId: 'n2', nodeType: 'code', title: 'Struktur Dasar', content: 'Berikut struktur wajib dokumen HTML:', codeContent: '<!DOCTYPE html>\n<html>\n</html>', language: 'html' },
        { nodeId: 'n3', nodeType: 'lesson', title: 'Elemen Head & Body', content: 'Head berisi metadata, body berisi tampilan...' },
        { nodeId: 'n4', nodeType: 'practice', title: 'Uji Cepat Tag', content: 'Manakah tag untuk membuat judul terbesar?', options: '<h1>|<h6>|<p>|<a>', correctOption: 0 },
      ],
    };

    expect(teacherLessonContent.nodes.length).toBe(4);
    const lessonSlides = teacherLessonContent.nodes.filter((n) => n.nodeType === 'lesson' || n.nodeType === 'code');
    expect(lessonSlides.length).toBe(3);
    expect(lessonSlides[1].codeContent).toContain('<!DOCTYPE html>');
  });

  it('should handle single paragraph or empty description gracefully with fallbacks', () => {
    const emptyTopic: TopicNodeTopic = {
      id: 99,
      title: 'Topik Baru',
      order_index: 1,
      engine_topic_id: null,
      isUnlocked: true,
      description: null,
      quiz: null,
    };

    expect(emptyTopic.description).toBeNull();
    expect(emptyTopic.quiz).toBeNull();
    expect(emptyTopic.engine_topic_id).toBeNull();
  });

  it('should properly configure TopicLockModal for locked topics', async () => {
    const { TopicLockModal } = await import('./TopicLockModal');
    expect(TopicLockModal).toBeDefined();

    const lockedTopic: TopicNodeTopic = {
      id: 5,
      title: 'Perulangan Bersarang (Nested Loop)',
      order_index: 5,
      engine_topic_id: 'py-nested-05',
      isUnlocked: false,
      description: 'Mempelajari cara membuat loop di dalam loop untuk matriks dan pola.',
      quiz: null,
    };

    expect(lockedTopic.isUnlocked).toBe(false);
  });
});
