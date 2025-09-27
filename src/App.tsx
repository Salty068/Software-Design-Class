import './App.css'
import { useNotify } from "./components/NotificationProvider";


function App() {
  const notify = useNotify();
  return (
    <>
      <main className="p-6 space-y-4">
        <button
          className="px-3 py-2 rounded bg-black text-white"
          onClick={() => notify({ title: "Saved", body: "New notfication", type: "success" })}
        >
          Trigger notification
        </button>
      </main>
    </>
  );
}

export default App
