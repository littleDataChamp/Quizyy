import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-600 text-white">
      <h1 className="text-6xl font-extrabold mb-8 drop-shadow-lg tracking-tight">Trivia Kahoot Clone</h1>
      
      <div className="flex flex-col gap-4 w-full max-w-sm px-4">
        <Link 
          to="/play" 
          className="bg-white text-purple-600 text-center font-bold text-2xl py-4 rounded-xl shadow-md hover:bg-gray-100 transition"
        >
          Join a Game
        </Link>
        <Link 
          to="/host" 
          className="bg-purple-800 text-white text-center font-semibold text-lg py-3 rounded-xl shadow-md hover:bg-purple-900 transition"
        >
          Host / Create Quiz
        </Link>
      </div>
    </div>
  );
}
