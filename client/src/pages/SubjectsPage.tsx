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
  hint?: string | null;
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
  const [hint, setHint] = useState('');
  const [questionImages, setQuestionImages] = useState<{ url: string; fileName: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRecord | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

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
      hint,
      questionImages: questionImages.map((img) => img.url).slice(0, 2),
    });

    setQuestionPrompt('');
    setExplanation('');
    setHint('');
    setQuestionImages([]);
    setOptions({ A: '', B: '', C: '', D: '' });
    setCorrectOption('A');
    await selectTopic(topicId);
  }

  async function processImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    if (questionImages.length >= 2) {
      setError('Maximum 2 images allowed.');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string)?.split(',')[1];
          if (!base64) {
            setError('Failed to read image file.');
            setUploading(false);
            return;
          }

          const data = await apiRequest<{ imageUrl: string }>('/upload/question-image', 'POST', {
            fileData: base64,
            fileName: file.name,
            fileType: file.type,
          });

          setQuestionImages((prev) => [...prev, { url: data.imageUrl, fileName: file.name }]);
          setUploading(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Image upload failed');
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file.');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
        event.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
        }
        return;
      }
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const files = event.dataTransfer?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        processImageFile(files[i]);
        return;
      }
    }

    setError('Please drop image files only.');
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

      <div className="grid gap-4 lg:grid-cols-2">
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
      </div>

      <section className="ui-card">
        <h2 className="mb-3 font-semibold">Questions ({questions.length})</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
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
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1 text-sm text-muted truncate">{image.fileName}</div>
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
                    <div className="space-y-2">
                      <div
                        onPaste={handlePaste}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        tabIndex={0}
                        className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
                          dragActive
                            ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <p className="text-sm font-medium">Drag & drop image here</p>
                        <p className="text-xs text-muted mt-1">or paste with Ctrl+V</p>
                      </div>
                      <label className="ui-btn-secondary block text-center cursor-pointer">
                        {uploading ? 'Uploading...' : 'Choose image file'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explanation"
                className="ui-input min-h-16"
              />
              <textarea
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Hint (optional, shown during quiz on demand)"
                className="ui-input min-h-12"
              />
              <button className="ui-btn-primary">Add Question</button>
            </form>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Question List ({questions.length})</p>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {questions.length === 0 ? (
                <p className="text-sm text-muted">No questions yet</p>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    onClick={() => setSelectedQuestion(question)}
                    className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 flex-shrink-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-accent transition-colors">{question.prompt}</p>
                    <p className="text-xs text-muted mt-1">Click to view details</p>
                    <div className="mt-2 flex gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => renameQuestion(question)} className="text-accent hover:underline">Edit</button>
                      <button onClick={() => removeQuestion(question.id)} className="text-red-500">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedQuestion(null)}>
          <div
            className="rounded-2xl bg-white dark:bg-slate-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
              <h2 className="text-lg font-semibold">Question Details</h2>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-2xl hover:opacity-60 transition-opacity"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted mb-2">Prompt</p>
                <p className="text-base font-medium">{selectedQuestion.prompt}</p>
              </div>

              {(selectedQuestion.image_url_1 || selectedQuestion.image_url_2) && (
                <div>
                  <p className="text-sm text-muted mb-2">Images</p>
                  <div className="grid gap-3 grid-cols-2">
                    {[selectedQuestion.image_url_1, selectedQuestion.image_url_2]
                      .filter((url): url is string => Boolean(url))
                      .map((imageUrl) => (
                        <img
                          key={imageUrl}
                          src={imageUrl}
                          alt="Question"
                          onClick={() => setExpandedImage(imageUrl)}
                          className="h-32 w-full rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-muted mb-1">Option A</p>
                  <p className="text-sm font-medium">{selectedQuestion.option_a}</p>
                  {selectedQuestion.correct_option === 'A' && <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Correct</p>}
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-muted mb-1">Option B</p>
                  <p className="text-sm font-medium">{selectedQuestion.option_b}</p>
                  {selectedQuestion.correct_option === 'B' && <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Correct</p>}
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-muted mb-1">Option C</p>
                  <p className="text-sm font-medium">{selectedQuestion.option_c}</p>
                  {selectedQuestion.correct_option === 'C' && <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Correct</p>}
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-muted mb-1">Option D</p>
                  <p className="text-sm font-medium">{selectedQuestion.option_d}</p>
                  {selectedQuestion.correct_option === 'D' && <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Correct</p>}
                </div>
              </div>

              {selectedQuestion.hint && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-xs text-amber-900 dark:text-amber-200 font-medium mb-1">Hint</p>
                  <p className="text-sm text-amber-800 dark:text-amber-100">{selectedQuestion.hint}</p>
                </div>
              )}

              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs text-muted font-medium mb-1">Explanation</p>
                <p className="text-sm">{selectedQuestion.explanation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {expandedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setExpandedImage(null)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={expandedImage}
              alt="Expanded"
              className="max-w-4xl max-h-[90vh] rounded-lg object-contain"
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 bg-white dark:bg-slate-900 rounded-full w-10 h-10 flex items-center justify-center hover:opacity-60 transition-opacity text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}