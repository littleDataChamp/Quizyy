import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function QuizBuilder() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{
    question_text: '',
    options: ['', '', '', ''],
    correct_option_index: 0,
    time_limit: 20
  }]);
  const navigate = useNavigate();

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      options: ['', '', '', ''],
      correct_option_index: 0,
      time_limit: 20
    }]);
  };

  const handleSave = async () => {
    if (!title.trim()) return alert('Title required');
    
    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({ title })
      .select()
      .single();

    if (quiz && !quizError) {
      // Insert questions
      const qs = questions.map((q, i) => ({
        ...q,
        quiz_id: quiz.id,
        sort_order: i
      }));
      await supabase.from('questions').insert(qs);
      navigate('/host');
    } else {
      console.error(quizError);
      alert('Failed to save quiz');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quiz Builder</h1>
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold flex items-center gap-2">
          <Save size={18} /> Save Quiz
        </button>
      </div>

      <input 
        type="text" 
        placeholder="Enter Quiz Title" 
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full text-3xl font-bold p-4 border-b-2 border-gray-300 focus:border-blue-500 outline-none bg-transparent mb-8"
      />

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Question {qIndex + 1}</h3>
            {questions.length > 1 && (
              <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} className="text-red-500">
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <input 
            type="text" 
            placeholder="Question Text" 
            value={q.question_text}
            onChange={e => {
              const newQ = [...questions];
              newQ[qIndex].question_text = e.target.value;
              setQuestions(newQ);
            }}
            className="w-full text-xl p-3 bg-gray-50 border rounded mb-4"
          />
          <div className="grid grid-cols-2 gap-4">
            {q.options.map((opt, oIndex) => {
              const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
              return (
                <div key={oIndex} className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name={`correct-${qIndex}`}
                    checked={q.correct_option_index === oIndex}
                    onChange={() => {
                      const newQ = [...questions];
                      newQ[qIndex].correct_option_index = oIndex;
                      setQuestions(newQ);
                    }}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    placeholder={`Option ${oIndex + 1}`}
                    value={opt}
                    onChange={e => {
                      const newQ = [...questions];
                      newQ[qIndex].options[oIndex] = e.target.value;
                      setQuestions(newQ);
                    }}
                    className={`w-full p-3 rounded text-white font-semibold placeholder-white/70 outline-none ${colors[oIndex]}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button onClick={handleAddQuestion} className="w-full p-4 border-2 border-dashed border-gray-300 text-gray-500 font-bold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
        <Plus /> Add Question
      </button>
    </div>
  );
}
