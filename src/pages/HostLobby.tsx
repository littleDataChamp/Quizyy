import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { Play, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function HostLobby() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answersCount, setAnswersCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!pin) return;
    loadSession();
    
    const partSub = supabase.channel('participants')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${session?.id}` }, payload => {
        setParticipants(prev => [...prev, payload.new]);
      })
      .subscribe();

    const ansSub = supabase.channel('answers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers' }, () => {
        // ideally filter by question_id but realtime filter needs session id. Just count for now.
        setAnswersCount(c => c + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(partSub);
      supabase.removeChannel(ansSub);
    };
  }, [pin, session?.id]);

  useEffect(() => {
    let timer: any;
    if (session?.status === 'active' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (session?.status === 'active' && timeLeft === 0) {
      // Time's up
      updateStatus('scoreboard');
    }
    return () => clearInterval(timer);
  }, [session?.status, timeLeft]);

  // When all answers submitted, move to scoreboard
  useEffect(() => {
    if (session?.status === 'active' && participants.length > 0 && answersCount >= participants.length) {
      updateStatus('scoreboard');
    }
  }, [answersCount, participants.length, session?.status]);


  const loadSession = async () => {
    const { data: s } = await supabase.from('game_sessions').select('*, quizzes(*)').eq('pin', pin).single();
    if (s) {
      setSession(s);
      // Load participants manually once
      const { data: p } = await supabase.from('participants').select('*').eq('session_id', s.id);
      if (p) setParticipants(p);
      // Load questions
      const { data: q } = await supabase.from('questions').select('*').eq('quiz_id', s.quiz_id).order('sort_order', { ascending: true });
      if (q) setQuestions(q);
    }
  };

  const updateStatus = async (status: string, extra: any = {}) => {
    await supabase.from('game_sessions').update({ status, ...extra }).eq('id', session.id);
    setSession({ ...session, status, ...extra });
    if (status === 'active') {
      const q = questions[session.current_question_index || 0];
      setTimeLeft(q.time_limit);
      setAnswersCount(0);
    }
    if (status === 'podium') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  if (!session) return <div className="p-10 text-center">Loading...</div>;

  const currentQ = questions[session.current_question_index || 0];

  if (session.status === 'lobby') {
    const joinUrl = `${window.location.origin}${import.meta.env.BASE_URL}play`;
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="bg-white p-8 shadow-sm text-center flex justify-between items-center">
          <div>
            <h2 className="text-gray-500 font-bold uppercase tracking-widest">Join at</h2>
            <h1 className="text-4xl font-extrabold">{joinUrl}</h1>
          </div>
          <div>
            <h2 className="text-gray-500 font-bold uppercase tracking-widest">Game PIN</h2>
            <h1 className="text-6xl font-black tracking-widest">{pin}</h1>
          </div>
          <QRCodeSVG value={`${joinUrl}/${pin}`} size={100} />
        </div>
        
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="text-2xl font-bold bg-gray-200 py-2 px-4 rounded-full flex items-center gap-2">
              <Users /> {participants.length} Players
            </div>
            <button 
              onClick={() => updateStatus('active')}
              disabled={participants.length === 0}
              className="bg-blue-600 text-white px-8 py-3 rounded-full text-xl font-bold disabled:opacity-50 flex items-center gap-2"
            >
              Start Game <Play fill="currentColor" />
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {participants.map(p => (
              <div key={p.id} className="bg-white px-4 py-2 rounded-lg shadow-sm font-bold text-lg">
                {p.nickname}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (session.status === 'active') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-5xl font-bold mb-8">{currentQ.question_text}</h1>
        <div className="w-24 h-24 rounded-full bg-purple-600 text-white flex items-center justify-center text-4xl font-black mb-12">
          {timeLeft}
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
          {currentQ.options.map((opt: string, idx: number) => {
            const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
            return (
              <div key={idx} className={`${colors[idx]} text-white text-3xl font-bold p-8 rounded-lg shadow-md`}>
                {opt}
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-xl font-bold text-gray-500">
          Answers: {answersCount} / {participants.length}
        </div>
      </div>
    );
  }

  if (session.status === 'scoreboard') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
        <h1 className="text-5xl font-bold mb-8">Scoreboard</h1>
        <button 
          className="bg-blue-600 text-white px-8 py-3 rounded-full text-xl font-bold mb-12"
          onClick={() => {
            if (session.current_question_index < questions.length - 1) {
              updateStatus('active', { current_question_index: session.current_question_index + 1 });
            } else {
              updateStatus('podium');
            }
          }}
        >
          Next
        </button>
        {/* Placeholder for leaderboard fetch */}
        <p>Leaderboard calculations would go here (fetch from DB)</p>
      </div>
    );
  }

  if (session.status === 'podium') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
        <h1 className="text-6xl font-black mb-8 text-purple-600">Podium</h1>
        <button onClick={() => navigate('/host')} className="bg-gray-200 px-6 py-2 rounded-full font-bold">End Game</button>
      </div>
    );
  }

  return <div>Unknown state</div>;
}
