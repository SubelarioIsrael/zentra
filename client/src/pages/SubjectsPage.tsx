import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiRequest } from '../api/client';
import { HelperAlert } from '../components/HelperAlert';
import type { Subject, Topic } from '../types';

type QuestionRecord = {
  id: number;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  image_url_1?: string | null;
  image_url_2?: string | null;
  explanation: string;
};

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [questionPrompt, setQuestionPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [questionImages, setQuestionImages] = useState<string[]>([]);
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubjects().catch((err) => setError(err.message));
  }, []);

  async function loadSubjects() {
    const data = await apiRequest<{ subjects: Subject[] }>('/subjects');
    setSubjects(data.subjects);
    if (!subjectId && data.subjects.length) {
      await selectSubject(data.subjects[0].id);
    }
  }

  async function selectSubject(id: number) {
    setError('');
    setSubjectId(id);
    const data = await apiRequest<{ topics: Topic[] }>(`/subjects/${id}/topics`);
    setTopics(data.topics);
    setQuestions([]);
    if (data.topics.length) {
      await selectTopic(data.topics[0].id);
    } else {
      setTopicId(null);
    }
  }

  async function selectTopic(id: number) {
    setError('');
    setTopicId(id);
    const data = await apiRequest<{ questions: QuestionRecord[] }>(`/topics/${id}/questions`);
    setQuestions(data.questions);
  }

  async function createSubject(event: FormEvent) {
    event.preventDefault();
    if (!subjectName.trim()) return;
    await apiRequest('/subjects', 'POST', { name: subjectName, description: '' });
    setSubjectName('');
    await loadSubjects();
  }

  async function createTopic(event: FormEvent) {
    event.preventDefault();
    if (!subjectId || !topicName.trim()) {
      setError('Pick a subject first before adding a topic.');
      return;
    }
    await apiRequest(`/subjects/${subjectId}/topics`, 'POST', { name: topicName, description: '' });
    setTopicName('');
    await selectSubject(subjectId);
  }

  async function createQuestion(event: FormEvent) {
    event.preventDefault();
    if (!subjectId || !topicId) {
      setError('To add a question, select a subject and then a topic first.');
      return;
    }

    await apiRequest(`/topics/${topicId}/questions`, 'POST', {
      prompt: questionPrompt,
      options,
      correctOption,
      explanation,
      questionImages: questionImages.map((image) => image.trim()).filter(Boolean).slice(0, 2),
    });

    setQuestionPrompt('');
    setExplanation('');
    setQuestionImages([]);
    setOptions({ A: '', B: '', C: '', D: '' });
    setCorrectOption('A');
    await selectTopic(topicId);
  }

  async function renameSubject(id: number, currentName: string) {
    const value = window.prompt('New subject name', currentName);
    if (!value) return;
    await apiRequest(`/subjects/${id}`, 'PUT', { name: value, description: '' });
    await loadSubjects();
  }

  async function removeSubject(id: number) {
    await apiRequest(`/subjects/${id}`, 'DELETE');
    await loadSubjects();
  }

  async function renameTopic(id: number, currentName: string) {
    const value = window.prompt('New topic name', currentName);
    if (!value) return;
    await apiRequest(`/topics/${id}`, 'PUT', { name: value, description: '' });
    if (subjectId) await selectSubject(subjectId);
  }

  async function removeTopic(id: number) {
    await apiRequest(`/topics/${id}`, 'DELETE');
    if (subjectId) await selectSubject(subjectId);
  }

  async function removeQuestion(id: number) {
    await apiRequest(`/questions/${id}`, 'DELETE');
    if (topicId) await selectTopic(topicId);
  }

  async function renameQuestion(question: QuestionRecord) {
    const prompt = window.prompt('Edit question prompt', question.prompt);
    if (!prompt) return;
    await apiRequest(`/questions/${question.id}`, 'PUT', {
      prompt,
      explanation: question.explanation,
      options: {
        A: question.option_a,
        B: question.option_b,
        C: question.option_c,
        D: question.option_d,
      },
      correctOption: question.correct_option,
      questionImages: [question.image_url_1, question.image_url_2].filter(Boolean),
    });
    if (topicId) await selectTopic(topicId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subjects & Topics</h1>
        <p className="ui-subtitle mt-1">Organize your quiz world with clean subjects, topics, and questions.</p>
      </div>

      <HelperAlert>
        Start from left to right: select a subject, then a topic, then add/edit questions.
      </HelperAlert>

      {(subjectId === null || topicId === null) && (
        <HelperAlert tone="warn">
          Question actions need both a selected subject and topic.
        </HelperAlert>
      )}

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="ui-card">
          <h2 className="mb-3 font-semibold">Subjects</h2>
          <form onSubmit={createSubject} className="mb-3 flex gap-2">
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="New subject"
              className="ui-input"
            />
            <button className="ui-btn-primary">Add</button>
          </form>
          <ul className="space-y-2">
            {subjects.map((subject) => (
              <li
                key={subject.id}
                className={`rounded-xl border p-2 ${subjectId === subject.id ? 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-700 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <button className="w-full text-left" onClick={() => selectSubject(subject.id)}>
                  <p className="font-medium">{subject.name}</p>
                  <p className="text-xs text-muted">{subject.topic_count ?? 0} topics</p>
                </button>
                <div className="mt-2 flex gap-2 text-xs">
                  <button onClick={() => renameSubject(subject.id, subject.name)} className="text-accent hover:underline">Edit</button>
                  <button onClick={() => removeSubject(subject.id)} className="text-red-500">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="ui-card">
          <h2 className="mb-3 font-semibold">Topics</h2>
          <form onSubmit={createTopic} className="mb-3 flex gap-2">
            <input
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="New topic"
              className="ui-input"
            />
            <button className="ui-btn-primary">Add</button>
          </form>
          <ul className="space-y-2">
            {topics.map((topic) => (
              <li
                key={topic.id}
                className={`rounded-xl border p-2 ${topicId === topic.id ? 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-700 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <button className="w-full text-left" onClick={() => selectTopic(topic.id)}>
                  <p className="font-medium">{topic.name}</p>
                  <p className="text-xs text-muted">{topic.question_count ?? 0} questions</p>
                </button>
                <div className="mt-2 flex gap-2 text-xs">
                  <button onClick={() => renameTopic(topic.id, topic.name)} className="text-accent hover:underline">Edit</button>
                  <button onClick={() => removeTopic(topic.id)} className="text-red-500">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="ui-card">
          <h2 className="mb-3 font-semibold">Questions</h2>
          <form onSubmit={createQuestion} className="grid gap-2">
            <textarea
              value={questionPrompt}
              onChange={(e) => setQuestionPrompt(e.target.value)}
              placeholder="Question prompt"
              className="ui-input min-h-20"
            />
            {(['A', 'B', 'C', 'D'] as const).map((key) => (
              <input
                key={key}
                value={options[key]}
                onChange={(e) => setOptions((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={`Option ${key}`}
                className="ui-input"
              />
            ))}
            <select
              value={correctOption}
              onChange={(e) => setCorrectOption(e.target.value as 'A' | 'B' | 'C' | 'D')}
              className="ui-input"
            >
              <option value="A">Correct: A</option>
              <option value="B">Correct: B</option>
              <option value="C">Correct: C</option>
              <option value="D">Correct: D</option>
            </select>

            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-sm font-medium">Optional images (max 2)</p>
              <p className="ui-subtitle mt-1">Useful for diagrams, screenshots, and visual questions.</p>
              <div className="mt-2 grid gap-2">
                {questionImages.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={image}
                      onChange={(e) =>
                        setQuestionImages((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? e.target.value : entry)))
                      }
                      placeholder={`Image URL ${index + 1}`}
                      className="ui-input"
                    />
                    <button
                      type="button"
                      onClick={() => setQuestionImages((prev) => prev.filter((_, entryIndex) => entryIndex !== index))}
                      className="ui-btn-secondary"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {questionImages.length < 2 && (
                  <button
                    type="button"
                    onClick={() => setQuestionImages((prev) => [...prev, ''])}
                    className="ui-btn-secondary"
                  >
                    Add image field
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explanation"
              className="ui-input min-h-16"
            />
            <button className="ui-btn-primary">Add Question</button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {questions.map((question) => (
              <li key={question.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p>{question.prompt}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[question.image_url_1, question.image_url_2]
                    .filter((url): url is string => Boolean(url))
                    .map((imageUrl) => (
                      <img key={imageUrl} src={imageUrl} alt="Question" className="h-28 w-full rounded-lg object-cover" />
                    ))}
                </div>
                <div className="mt-1 flex gap-2 text-xs">
                  <button onClick={() => renameQuestion(question)} className="text-accent hover:underline">Edit</button>
                  <button onClick={() => removeQuestion(question.id)} className="text-red-500">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
