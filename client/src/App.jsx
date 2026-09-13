import { useEffect, useState } from 'react';
import { checkApiHealth } from './services/api.js';

function App() {
  const [connection, setConnection] = useState({ status: 'checking', message: 'API 연결 확인 중…' });

  useEffect(() => {
    checkApiHealth()
      .then((data) => {
        setConnection({
          status: data.ok ? 'connected' : 'error',
          message: data.message ?? 'API 서버와 연결되었습니다.',
        });
      })
      .catch(() => {
        setConnection({ status: 'error', message: 'API 서버에 연결할 수 없습니다.' });
      });
  }, []);

  return (
    <main className="app-shell">
      <section className="status-card" aria-labelledby="page-title">
        <div className="logo" aria-hidden="true">문</div>
        <p className="eyebrow">MUNJE · STEP 1</p>
        <h1 id="page-title">문제 풀이 플랫폼</h1>
        <p className="description">React 화면과 Express API를 연결하는 기본 프로젝트 구성이 완료되었습니다.</p>

        <div className={`connection ${connection.status}`} role="status" aria-live="polite">
          <span className="status-dot" />
          <span>{connection.message}</span>
        </div>

        <div className="stack" aria-label="기술 구성">
          <span>React</span>
          <span>Vite</span>
          <span>Node.js</span>
          <span>Express</span>
        </div>
      </section>
    </main>
  );
}

export default App;
