import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PlayerJoin() {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      navigate(`/play/${pin}`);
    } else {
      alert('PIN must be 6 digits');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full text-center">
        <h1 className="text-4xl font-extrabold text-purple-600 mb-8 tracking-tight">Trivia</h1>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Game PIN" 
            value={pin}
            onChange={e => setPin(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full text-center font-bold text-2xl p-4 border-2 border-gray-300 rounded-lg outline-none focus:border-purple-600 uppercase"
          />
          <button 
            type="submit"
            className="w-full bg-black text-white font-bold text-xl p-4 rounded-lg hover:bg-gray-800 transition"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
