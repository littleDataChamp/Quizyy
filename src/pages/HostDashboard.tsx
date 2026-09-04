import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Play } from 'lucide-react';

export default function HostDashboard() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const { data } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
    if (data) setQuizzes(data);
  };

  const hostGame = async (quizId: string) => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const { data } = await supabase
      .from('game_sessions')
      .insert({ pin, quiz_id: quizId, status: 'lobby' })
      .select()
      .single();
    
    if (data) {
      navigate(`/host/lobby/${pin}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Quizzes</h1>
        <Link to="/host/build" className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} /> Create Quiz
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white p-6 rounded-lg shadow-sm border flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{quiz.title}</h2>
              <p className="text-sm text-gray-500">Created {new Date(quiz.created_at).toLocaleDateString()}</p>
            </div>
            <button 
              onClick={() => hostGame(quiz.id)}
              className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition"
              title="Host this quiz"
            >
              <Play size={24} fill="currentColor" />
            </button>
          </div>
        ))}
        {quizzes.length === 0 && (
          <p className="text-gray-500 col-span-2 text-center py-10">No quizzes yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}
