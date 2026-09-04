import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PlayerGameView() {
  const { pin } = useParams();
  const [session, setSession] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [participant, setParticipant] = useState<any>(null);
  const [answered, setAnswered] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [currentQ, setCurrentQ] = useState<any>(null);

  // 1. Fetch Session
  useEffect(() => {
    if (!pin) return;
    const fetchSession = async () => {
      const { data } = await supabase.from('game_sessions').select('*').eq('pin', pin).single();
      if (data) setSession(data);
    };
    fetchSession();

    const sub = supabase.channel(`public:game_sessions:id=eq.${session?.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `pin=eq.${pin}` }, payload => {
        const newSession = payload.new;
        setSession(newSession);
        if (newSession.status === 'active' && newSession.current_question_index !== session?.current_question_index) {
          setAnswered(false);
          setQuestionStartTime(Date.now());
          loadCurrentQuestion(newSession.quiz_id, newSession.current_question_index);
        } else if (newSession.status === 'active' && !session) {
          setAnswered(false);
          setQuestionStartTime(Date.now());
          loadCurrentQuestion(newSession.quiz_id, newSession.current_question_index);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [pin, session?.id, session?.current_question_index]);

  const loadCurrentQuestion = async (quizId: string, index: number) => {
    const { data } = await supabase.from('questions').select('*').eq('quiz_id', quizId).order('sort_order', { ascending: true });
    if (data && data[index]) {
      setCurrentQ(data[index]);
    }
  };

  const joinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !nickname.trim()) return;

    const { data } = await supabase.from('participants').insert({
      session_id: session.id,
      nickname
    }).select().single();

    if (data) {
      setParticipant(data);
    } else {
      alert('Error joining');
    }
  };

  const submitAnswer = async (index: number) => {
    if (answered || !participant || !currentQ) return;
    setAnswered(true);

    const timeTaken = (Date.now() - questionStartTime) / 1000;
    const timeLimit = currentQ.time_limit;
    
    // Scoring algo: Base Points * (1 - (Time Taken / Total Time) * 0.5)
    let score = 0;
    if (index === currentQ.correct_option_index) {
      const basePoints = 1000 * (currentQ.points_multiplier || 1);
      const penalty = (timeTaken / timeLimit) * 0.5;
      score = Math.round(basePoints * (1 - Math.min(penalty, 0.5)));
    }

    await supabase.from('answers').insert({
      participant_id: participant.id,
      question_id: currentQ.id,
      selected_option_index: index,
      time_taken: timeTaken,
      score_earned: score
    });

    // Update participant total score (simplified, could be a DB trigger)
    await supabase.rpc('increment_score', { row_id: participant.id, amount: score });
  };

  if (!session) return <div className="p-8 text-center font-bold">Connecting...</div>;

  if (!participant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full text-center">
          <form onSubmit={joinGame} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Nickname" 
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full text-center font-bold text-2xl p-4 border-2 border-gray-300 rounded-lg outline-none focus:border-purple-600"
            />
            <button type="submit" className="w-full bg-black text-white font-bold text-xl p-4 rounded-lg hover:bg-gray-800 transition">
              OK, go!
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (session.status === 'lobby') {
    return (
      <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-8 text-white text-center">
        <h1 className="text-4xl font-extrabold mb-4">You're in!</h1>
        <p className="text-xl font-bold">See your nickname on screen</p>
      </div>
    );
  }

  if (session.status === 'active' && !answered) {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
    return (
      <div className="min-h-screen grid grid-cols-2 grid-rows-2 gap-2 p-2 bg-gray-100">
        {[0, 1, 2, 3].map(i => (
          <button 
            key={i}
            onClick={() => submitAnswer(i)}
            className={`${colors[i]} rounded-lg shadow-md active:scale-95 transition-transform`}
          />
        ))}
      </div>
    );
  }

  if (session.status === 'active' && answered) {
    return (
      <div className="min-h-screen bg-purple-600 flex flex-col items-center justify-center p-8 text-white text-center">
        <h1 className="text-3xl font-extrabold mb-4">Waiting for others...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-8 text-white text-center">
      <h1 className="text-4xl font-extrabold mb-4">Get Ready!</h1>
      <p className="text-xl font-bold">Loading next screen...</p>
    </div>
  );
}
