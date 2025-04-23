import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/hello')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setMessage(data.message))
      .catch((err) => console.error('API Error:', err));
  }, []);

  return (
    <div>
      <h1>Frontend React App</h1>
      <p>Message from API: {message ? message : 'Loading...'}</p>
    </div>
  );
}

export default App;
